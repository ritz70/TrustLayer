/**
 * Verification Orchestrator.
 *
 * Coordinates:
 * 1. Deterministic subprocess test runner
 * 2. LLM Judge with Zod schema validation
 * 3. Policy release gate (Code > AI)
 */

import { ContractEvent, type Criterion, type Verdict } from "@/lib/types";
import {
  evaluateReleasePolicy,
  type ReleaseGateResult,
} from "@/lib/policy/release-gate";
import { judgeDeliverableWithLLM, type JudgeDeliverableResult } from "./llm-judge";
import { runDeliverableTests, type RunTestsResult } from "./test-runner";

export interface VerifySubmissionInput {
  contractTitle: string;
  contractDescription: string;
  criteria: Criterion[];
  submissionCode: string;
  testCode: string;
  hasOpenDispute?: boolean;
  confidenceThreshold?: number;
}

export interface VerificationResult {
  testRun: RunTestsResult;
  judge: JudgeDeliverableResult;
  policy: ReleaseGateResult;
  overallVerdict: Verdict;
  recommendedEvent:
    | ContractEvent.PASS_HIGH_CONFIDENCE
    | ContractEvent.FAIL
    | ContractEvent.UNCERTAIN;
}

export async function verifyDeliverable(
  input: VerifySubmissionInput,
): Promise<VerificationResult> {
  const {
    contractTitle,
    contractDescription,
    criteria,
    submissionCode,
    testCode,
    hasOpenDispute = false,
    confidenceThreshold,
  } = input;

  // Step 1: Execute deterministic test suite in sandboxed subprocess
  const testRun = await runDeliverableTests({
    submissionCode,
    testCode,
  });

  // Step 2: Run LLM Judge for structural inspection and test-gaming detection
  const judge = await judgeDeliverableWithLLM({
    contractTitle,
    contractDescription,
    criteria,
    submissionCode,
    unitTestSummary: {
      passed: testRun.passed,
      total: testRun.totalTests,
      failed: testRun.failedTests,
    },
  });

  // Step 3: Evaluate policy release gate
  const policy = evaluateReleasePolicy({
    deterministicSummary: {
      passed: testRun.passed,
      totalTests: testRun.totalTests,
      failedTests: testRun.failedTests,
      details: testRun.details,
    },
    verdict: judge.verdict,
    hasOpenDispute,
    confidenceThreshold,
  });

  // Consolidate evidence into overall verdict
  const combinedEvidence: string[] = [
    ...(testRun.passed
      ? [`Tests: All ${testRun.totalTests} unit test(s) passed.`]
      : [`Tests: ${testRun.failedTests} of ${testRun.totalTests} unit test(s) failed.`]),
    ...judge.verdict.evidence,
    ...policy.reasons,
  ];

  const overallVerdict: Verdict = {
    verdict:
      policy.decision === "RELEASE"
        ? "pass"
        : policy.decision === "HOLD"
          ? "fail"
          : "uncertain",
    confidence: judge.verdict.confidence,
    evidence: combinedEvidence,
  };

  return {
    testRun,
    judge,
    policy,
    overallVerdict,
    recommendedEvent: policy.recommendedEvent,
  };
}

