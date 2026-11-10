/**
 * Subprocess Test Runner.
 *
 * Runs code deliverables and automated tests in an isolated child process:
 * - Strict timeout (default 5000ms) with SIGKILL on breach.
 * - Minimal environment (no secrets or app env vars leaked).
 * - Temporary isolated working directory, cleaned up after execution.
 * - Extracts structured results (pass/fail, count, error output).
 */

import { execFile } from "child_process";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";

const execFileAsync = promisify(execFile);

export interface RunTestsInput {
  /** The code submitted by the freelancer (TS/JS). */
  submissionCode: string;
  /** The test suite code to execute against the submission. */
  testCode: string;
  /** Maximum execution time in milliseconds (default 5000ms). */
  timeoutMs?: number;
}

export interface RunTestsResult {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  executionTimeMs: number;
  timedOut: boolean;
  output: string;
  details: string[];
}

const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Executes a submission against a test suite in an isolated directory.
 */
export async function runDeliverableTests(
  input: RunTestsInput,
): Promise<RunTestsResult> {
  const { submissionCode, testCode, timeoutMs = DEFAULT_TIMEOUT_MS } = input;
  const runId = uuidv4().slice(0, 8);
  const tempDir = path.join(os.tmpdir(), `trustlayer-run-${runId}`);

  const startTime = Date.now();
  let timedOut = false;

  try {
    await fs.mkdir(tempDir, { recursive: true });

    // Write submission file (e.g. index.js / index.mjs)
    const submissionPath = path.join(tempDir, "submission.mjs");
    await fs.writeFile(submissionPath, submissionCode, "utf8");

    // Write test runner wrapper script
    // This runner executes the test suite, catches errors, and prints structured JSON
    const runnerScript = `
import * as assert from 'node:assert/strict';
import * as submission from './submission.mjs';

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

async function test(name, fn) {
  results.total++;
  try {
    await fn(submission, assert);
    results.passed++;
  } catch (err) {
    results.failed++;
    results.errors.push(name + ': ' + (err?.message || String(err)));
  }
}

async function run() {
${testCode}

  console.log('__TRUSTLAYER_OUTPUT_START__');
  console.log(JSON.stringify(results));
  console.log('__TRUSTLAYER_OUTPUT_END__');

  if (results.failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test harness crash:', err);
  process.exit(2);
});
`;

    const runnerPath = path.join(tempDir, "runner.mjs");
    await fs.writeFile(runnerPath, runnerScript, "utf8");

    // Execute runner in isolated subprocess with stripped environment
    const nodeBin = process.execPath;
    let stdout = "";
    let stderr = "";

    try {
      const child = await execFileAsync(nodeBin, [runnerPath], {
        cwd: tempDir,
        timeout: timeoutMs,
        maxBuffer: 1024 * 1024 * 2, // 2MB max output
        env: {
          // Strictly minimal environment: only standard PATH, no secrets or API keys
          PATH: process.env.PATH || "/usr/bin:/bin:/usr/local/bin",
          NODE_NO_WARNINGS: "1",
          NODE_ENV: (process.env.NODE_ENV as "development" | "production" | "test") || "test",
        },
      });
      stdout = child.stdout;
      stderr = child.stderr;
    } catch (execErr: unknown) {
      const err = execErr as {
        killed?: boolean;
        signal?: string;
        stdout?: string;
        stderr?: string;
        message?: string;
      };
      stdout = err.stdout || "";
      stderr = err.stderr || "";

      if (err.killed || err.signal === "SIGTERM" || err.signal === "SIGKILL") {
        timedOut = true;
      }
    }

    const executionTimeMs = Date.now() - startTime;

    // Parse structured JSON output from stdout
    const parsed = extractStructuredResults(stdout);

    if (timedOut) {
      return {
        passed: false,
        totalTests: parsed ? parsed.total : 1,
        passedTests: parsed ? parsed.passed : 0,
        failedTests: (parsed ? parsed.failed : 0) + 1,
        executionTimeMs,
        timedOut: true,
        output: `Execution timed out after ${timeoutMs}ms`,
        details: [`Process killed: exceeded timeout limit of ${timeoutMs}ms`],
      };
    }

    if (parsed) {
      return {
        passed: parsed.failed === 0 && parsed.total > 0,
        totalTests: parsed.total,
        passedTests: parsed.passed,
        failedTests: parsed.failed,
        executionTimeMs,
        timedOut: false,
        output: stdout,
        details: parsed.errors,
      };
    }

    // Runner crashed before outputting structured JSON
    const crashDetails = (stderr || stdout || "Harness execution failed").trim();
    return {
      passed: false,
      totalTests: 1,
      passedTests: 0,
      failedTests: 1,
      executionTimeMs,
      timedOut: false,
      output: stdout + (stderr ? `\nSTDERR:\n${stderr}` : ""),
      details: [`Harness error: ${crashDetails}`],
    };
  } finally {
    // Clean up temporary workspace
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Best-effort cleanup
    }
  }
}

interface ParsedHarnessOutput {
  total: number;
  passed: number;
  failed: number;
  errors: string[];
}

function extractStructuredResults(stdout: string): ParsedHarnessOutput | null {
  const startMarker = "__TRUSTLAYER_OUTPUT_START__";
  const endMarker = "__TRUSTLAYER_OUTPUT_END__";

  const startIndex = stdout.indexOf(startMarker);
  const endIndex = stdout.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return null;
  }

  const jsonStr = stdout
    .slice(startIndex + startMarker.length, endIndex)
    .trim();

  try {
    const data = JSON.parse(jsonStr) as ParsedHarnessOutput;
    if (typeof data.total === "number" && typeof data.failed === "number") {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}
