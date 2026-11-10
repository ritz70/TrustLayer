/**
 * Deterministic policy release gate.
 *
 * Implements the release criteria defined in AGENTS.md Section 6:
 * - Deterministic tests ALWAYS override the LLM (any test failure forces HELD).
 * - Release ONLY if:
 *   1. All deterministic tests pass
 *   2. LLM verdict is "pass"
 *   3. Confidence >= RELEASE_CONFIDENCE (default 0.85)
 *   4. No open dispute
 * - Otherwise: HELD or IN_REVIEW (human review).
 *
 * Plain, deterministic code. Never the LLM, moving money.
 */

import { ContractEvent, type Verdict } from "@/lib/types";

export const DEFAULT_RELEASE_CONFIDENCE = 0.85;

export interface DeterministicExecutionSummary {
  passed: boolean;
  totalTests?: number;
  failedTests?: number;
  details?: string[];
}

export interface ReleaseGateInput {
  deterministicSummary: DeterministicExecutionSummary;
  verdict: Verdict;
  hasOpenDispute?: boolean;
  confidenceThreshold?: number;
}

export type ReleaseDecision = "RELEASE" | "HOLD" | "REVIEW";

export interface ReleaseGateResult {
  decision: ReleaseDecision;
  recommendedEvent:
    | ContractEvent.PASS_HIGH_CONFIDENCE
    | ContractEvent.FAIL
    | ContractEvent.UNCERTAIN;
  reasons: string[];
}

/**
 * Validates and sanitizes a Verdict object.
 * Any malformed verdict is safely demoted to "uncertain" with 0 confidence.
 */
export function sanitizeVerdict(v: unknown): Verdict {
  if (!v || typeof v !== "object") {
    return {
      verdict: "uncertain",
      confidence: 0,
      evidence: ["Malformed verdict: output is not an object"],
    };
  }

  const candidate = v as Record<string, unknown>;
  const validVerdicts = new Set(["pass", "fail", "uncertain"]);
  const verdictStr = String(candidate.verdict ?? "").toLowerCase();

  if (!validVerdicts.has(verdictStr)) {
    return {
      verdict: "uncertain",
      confidence: 0,
      evidence: [`Malformed verdict: unrecognized verdict string '${candidate.verdict}'`],
    };
  }

  const confNum = Number(candidate.confidence);
  const confidence =
    Number.isFinite(confNum) && confNum >= 0 && confNum <= 1 ? confNum : 0;

  const rawEvidence = Array.isArray(candidate.evidence)
    ? candidate.evidence
    : [];
  const evidence = rawEvidence
    .map((item) => String(item ?? "").trim())
    .filter((str) => str.length > 0);

  return {
    verdict: verdictStr as "pass" | "fail" | "uncertain",
    confidence,
    evidence,
  };
}

/**
 * Pure evaluation function for release policy.
 */
export function evaluateReleasePolicy(input: ReleaseGateInput): ReleaseGateResult {
  const {
    deterministicSummary,
    verdict: rawVerdict,
    hasOpenDispute = false,
    confidenceThreshold = DEFAULT_RELEASE_CONFIDENCE,
  } = input;

  const reasons: string[] = [];
  const verdict = sanitizeVerdict(rawVerdict);

  // 1. Open dispute blocks everything
  if (hasOpenDispute) {
    reasons.push("Contract has an open dispute");
    return {
      decision: "HOLD",
      recommendedEvent: ContractEvent.FAIL,
      reasons,
    };
  }

  // 2. Deterministic unit tests: any failure forces FAIL / HELD
  if (!deterministicSummary.passed) {
    reasons.push(
      "Deterministic test suite failed" +
        (deterministicSummary.failedTests
          ? ` (${deterministicSummary.failedTests} failing tests)`
          : ""),
    );
    if (deterministicSummary.details && deterministicSummary.details.length > 0) {
      reasons.push(...deterministicSummary.details);
    }
    return {
      decision: "HOLD",
      recommendedEvent: ContractEvent.FAIL,
      reasons,
    };
  }

  // 3. LLM judge evaluations
  if (verdict.verdict === "fail") {
    reasons.push("LLM verifier rejected submission");
    reasons.push(...verdict.evidence);
    return {
      decision: "HOLD",
      recommendedEvent: ContractEvent.FAIL,
      reasons,
    };
  }

  if (verdict.verdict === "uncertain") {
    reasons.push("LLM verifier verdict is uncertain; routed to human review");
    reasons.push(...verdict.evidence);
    return {
      decision: "REVIEW",
      recommendedEvent: ContractEvent.UNCERTAIN,
      reasons,
    };
  }

  // 4. LLM verdict is "pass" -> check confidence threshold
  if (verdict.verdict === "pass") {
    if (verdict.confidence >= confidenceThreshold) {
      reasons.push(
        `All checks passed with high confidence (${(verdict.confidence * 100).toFixed(1)}% >= ${(confidenceThreshold * 100).toFixed(1)}%)`,
      );
      reasons.push(...verdict.evidence);
      return {
        decision: "RELEASE",
        recommendedEvent: ContractEvent.PASS_HIGH_CONFIDENCE,
        reasons,
      };
    }

    // Confidence below threshold -> human review
    reasons.push(
      `Pass verdict confidence (${(verdict.confidence * 100).toFixed(1)}%) below required threshold (${(confidenceThreshold * 100).toFixed(1)}%); routed to human review`,
    );
    reasons.push(...verdict.evidence);
    return {
      decision: "REVIEW",
      recommendedEvent: ContractEvent.UNCERTAIN,
      reasons,
    };
  }

  // Fallback safety catch
  return {
    decision: "REVIEW",
    recommendedEvent: ContractEvent.UNCERTAIN,
    reasons: ["Unexpected state in policy evaluation; routed to human review for safety"],
  };
}
