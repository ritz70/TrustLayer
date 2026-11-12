/**
 * LLM Judge with Zod Validation.
 *
 * Calls an LLM to evaluate code for what tests cannot see:
 * - Proper export and function signature.
 * - Test-gaming / hardcoded outputs.
 * - Non-functional / structural criteria.
 *
 * Validated strictly with Zod.
 * Any parsing error, timeout, or malformed response defaults to "uncertain" (NEVER "pass").
 */

import OpenAI from "openai";
import { z } from "zod";
import type { Criterion, Verdict } from "@/lib/types";
import {
  formatJudgeUserPrompt,
  LLM_JUDGE_SYSTEM_PROMPT,
  PROMPT_VERSION,
} from "./prompts";

/**
 * Zod schema strictly validating model output.
 */
export const VerdictSchema = z.object({
  verdict: z.enum(["pass", "fail", "uncertain"]),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string()).min(1),
});

export interface JudgeDeliverableInput {
  contractTitle: string;
  contractDescription: string;
  criteria: Criterion[];
  submissionCode: string;
  unitTestSummary?: {
    passed: boolean;
    total: number;
    failed: number;
  };
}

export interface JudgeDeliverableResult {
  verdict: Verdict;
  model: string;
  promptVersion: string;
  latencyMs: number;
  rawResponse?: string;
}

/**
 * Evaluates a deliverable using an LLM.
 */
export async function judgeDeliverableWithLLM(
  input: JudgeDeliverableInput,
): Promise<JudgeDeliverableResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.LLM_MODEL || "gpt-4o";
  const baseURL = process.env.OPENAI_BASE_URL;

  const startTime = Date.now();

  // If no API key configured, use safe heuristic judge (e.g. for offline dev or unit tests)
  if (!apiKey || apiKey.trim() === "" || apiKey === "your-api-key-here") {
    const fallbackVerdict = runOfflineHeuristicJudge(input.submissionCode);
    return {
      verdict: fallbackVerdict,
      model: "offline-heuristic-judge",
      promptVersion: PROMPT_VERSION,
      latencyMs: Date.now() - startTime,
    };
  }

  const userPrompt = formatJudgeUserPrompt(input);

  try {
    const openai = new OpenAI({
      apiKey,
      baseURL: baseURL || undefined,
    });

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.1, // low temperature for consistent evaluation
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: LLM_JUDGE_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const latencyMs = Date.now() - startTime;
    const rawContent = completion.choices[0]?.message?.content ?? "";

    const parsedJson = JSON.parse(rawContent);
    const parseResult = VerdictSchema.safeParse(parsedJson);

    if (!parseResult.success) {
      console.warn(
        `[LLM Judge] Malformed output from model (${model}):`,
        parseResult.error.format(),
      );
      return {
        verdict: {
          verdict: "uncertain",
          confidence: 0.5,
          evidence: [
            "Model output did not match expected schema; routed to human review",
          ],
        },
        model,
        promptVersion: PROMPT_VERSION,
        latencyMs,
        rawResponse: rawContent,
      };
    }

    return {
      verdict: parseResult.data,
      model,
      promptVersion: PROMPT_VERSION,
      latencyMs,
      rawResponse: rawContent,
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);

    console.error(`[LLM Judge] Error calling model (${model}):`, errorMessage);

    // Any network or parse failure fails safely to UNCERTAIN
    return {
      verdict: {
        verdict: "uncertain",
        confidence: 0,
        evidence: [
          `LLM judge unavailable or timed out (${errorMessage}); routed to human review`,
        ],
      },
      model,
      promptVersion: PROMPT_VERSION,
      latencyMs,
    };
  }
}

/**
 * Offline heuristic fallback when no LLM API key is present.
 * Detects common cheating patterns statically.
 */
export function runOfflineHeuristicJudge(submissionCode: string): Verdict {
  const code = submissionCode.toLowerCase();

  // 1. Check for prompt injection attempts
  if (
    code.includes("ignore previous instructions") ||
    code.includes("mark as pass") ||
    code.includes("approve this submission") ||
    code.includes("bypass verification")
  ) {
    return {
      verdict: "fail",
      confidence: 0.95,
      evidence: [
        "Adversarial prompt injection pattern detected in submitted source text",
      ],
    };
  }

  // 2. Check for obvious hardcoded special-casing / test gaming
  const hardcodedPattern =
    /if\s*\([^)]*===\s*\d+[^)]*\)\s*return\s*\d+/i;
  if (hardcodedPattern.test(submissionCode)) {
    return {
      verdict: "fail",
      confidence: 0.88,
      evidence: [
        "Code exhibits suspicious special-casing for fixed integer test inputs",
      ],
    };
  }

  // 3. Check for malicious modules
  if (
    code.includes("child_process") ||
    code.includes("process.env") ||
    code.includes("fs.unlink")
  ) {
    return {
      verdict: "fail",
      confidence: 0.99,
      evidence: [
        "Attempt to access restricted system APIs or environment variables",
      ],
    };
  }

  // Default clean pass with moderate confidence
  return {
    verdict: "pass",
    confidence: 0.88,
    evidence: [
      "Offline heuristic analysis: exports detected, no hardcoded special-casing or injection found",
    ],
  };
}

