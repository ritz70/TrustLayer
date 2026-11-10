import { describe, expect, it } from "vitest";
import { ContractEvent, type Verdict } from "@/lib/types";
import {
  DEFAULT_RELEASE_CONFIDENCE,
  evaluateReleasePolicy,
  sanitizeVerdict,
} from "../release-gate";

describe("Policy Release Gate - Deterministic Code Safety", () => {
  const passingTestSummary = {
    passed: true,
    totalTests: 5,
    failedTests: 0,
    details: ["All 5 unit tests passed successfully"],
  };

  const failingTestSummary = {
    passed: false,
    totalTests: 5,
    failedTests: 2,
    details: ["Test 2 failed: expected 42 but got 0", "Test 4 failed: timeout"],
  };

  describe("Rule 1: Deterministic tests always override LLM", () => {
    it("forces HOLD even when LLM says pass with 100% confidence", () => {
      const llmVerdict: Verdict = {
        verdict: "pass",
        confidence: 1.0,
        evidence: ["Code looks magnificent, no cheating detected"],
      };

      const result = evaluateReleasePolicy({
        deterministicSummary: failingTestSummary,
        verdict: llmVerdict,
      });

      expect(result.decision).toBe("HOLD");
      expect(result.recommendedEvent).toBe(ContractEvent.FAIL);
      expect(
        result.reasons.some((r) => r.includes("Deterministic test suite failed")),
      ).toBe(true);
    });
  });

  describe("Rule 2: Open disputes block release", () => {
    it("forces HOLD when a dispute is open, regardless of passed tests and high confidence", () => {
      const perfectVerdict: Verdict = {
        verdict: "pass",
        confidence: 0.99,
        evidence: ["Everything matches"],
      };

      const result = evaluateReleasePolicy({
        deterministicSummary: passingTestSummary,
        verdict: perfectVerdict,
        hasOpenDispute: true,
      });

      expect(result.decision).toBe("HOLD");
      expect(result.recommendedEvent).toBe(ContractEvent.FAIL);
      expect(result.reasons).toContain("Contract has an open dispute");
    });
  });

  describe("Rule 3: LLM Judge Decisions", () => {
    it("releases when deterministic tests pass and LLM passes with confidence >= threshold", () => {
      const goodVerdict: Verdict = {
        verdict: "pass",
        confidence: 0.92,
        evidence: [
          "Signature matches taxCalculator(income, status)",
          "No hardcoded responses detected",
        ],
      };

      const result = evaluateReleasePolicy({
        deterministicSummary: passingTestSummary,
        verdict: goodVerdict,
        confidenceThreshold: DEFAULT_RELEASE_CONFIDENCE, // 0.85
      });

      expect(result.decision).toBe("RELEASE");
      expect(result.recommendedEvent).toBe(ContractEvent.PASS_HIGH_CONFIDENCE);
      expect(
        result.reasons.some((r) => r.includes("All checks passed with high confidence")),
      ).toBe(true);
    });

    it("routes to human REVIEW when LLM passes but confidence is below threshold", () => {
      const lowConfVerdict: Verdict = {
        verdict: "pass",
        confidence: 0.70, // Below 0.85
        evidence: ["Implementation is unusual, may have edge case issues"],
      };

      const result = evaluateReleasePolicy({
        deterministicSummary: passingTestSummary,
        verdict: lowConfVerdict,
        confidenceThreshold: 0.85,
      });

      expect(result.decision).toBe("REVIEW");
      expect(result.recommendedEvent).toBe(ContractEvent.UNCERTAIN);
      expect(
        result.reasons.some((r) => r.includes("below required threshold")),
      ).toBe(true);
    });

    it("holds funds when LLM returns fail", () => {
      const failVerdict: Verdict = {
        verdict: "fail",
        confidence: 0.95,
        evidence: [
          "Code special-cases test inputs with if (input === 100) return 42;",
        ],
      };

      const result = evaluateReleasePolicy({
        deterministicSummary: passingTestSummary,
        verdict: failVerdict,
      });

      expect(result.decision).toBe("HOLD");
      expect(result.recommendedEvent).toBe(ContractEvent.FAIL);
      expect(result.reasons).toContain("LLM verifier rejected submission");
    });

    it("routes to human REVIEW when LLM returns uncertain", () => {
      const uncertainVerdict: Verdict = {
        verdict: "uncertain",
        confidence: 0.5,
        evidence: ["Cannot conclusively verify non-functional requirement"],
      };

      const result = evaluateReleasePolicy({
        deterministicSummary: passingTestSummary,
        verdict: uncertainVerdict,
      });

      expect(result.decision).toBe("REVIEW");
      expect(result.recommendedEvent).toBe(ContractEvent.UNCERTAIN);
    });
  });

  describe("Rule 4: Malformed verdict sanitization", () => {
    it("handles null or non-object verdict by routing to REVIEW", () => {
      const result = evaluateReleasePolicy({
        deterministicSummary: passingTestSummary,
        verdict: null as unknown as Verdict,
      });

      expect(result.decision).toBe("REVIEW");
      expect(result.recommendedEvent).toBe(ContractEvent.UNCERTAIN);
      expect(
        result.reasons.some((r) => r.includes("Malformed verdict")),
      ).toBe(true);
    });

    it("handles invalid verdict strings safely without crashing", () => {
      const malformed = {
        verdict: "DEFINITELY_RELEASE_MONEY_NOW",
        confidence: 1.0,
      };

      const sanitized = sanitizeVerdict(malformed);
      expect(sanitized.verdict).toBe("uncertain");
      expect(sanitized.confidence).toBe(0);

      const result = evaluateReleasePolicy({
        deterministicSummary: passingTestSummary,
        verdict: malformed as unknown as Verdict,
      });

      expect(result.decision).toBe("REVIEW");
      expect(result.recommendedEvent).toBe(ContractEvent.UNCERTAIN);
    });

    it("clamps out-of-range confidence numbers", () => {
      const negativeConf = sanitizeVerdict({
        verdict: "pass",
        confidence: -0.5,
      });
      expect(negativeConf.confidence).toBe(0);

      const overflowConf = sanitizeVerdict({
        verdict: "pass",
        confidence: 15.0,
      });
      expect(overflowConf.confidence).toBe(0);
    });
  });
});

