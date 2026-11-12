import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appendAuditEvent, getContract, updateContract } from "@/lib/db/store";
import { createAuditEvent } from "@/lib/escrow/audit-log";
import { getNextState } from "@/lib/escrow/state-machine";
import { verifyDeliverable } from "@/lib/verifier/verify";
import { ContractEvent, ContractState } from "@/lib/types";

const SubmitSchema = z.object({
  submissionCode: z.string().min(1, "submissionCode cannot be empty"),
  testCode: z
    .string()
    .default("")
    .describe("Optional test suite override; defaults to fixture or criteria"),
  actor: z.string().default("freelancer"),
});

// Default fallback test code if none is provided in the request
const DEFAULT_FALLBACK_TESTS = `
  await test('exports deliverable', (sub, assert) => {
    assert.ok(sub, 'Deliverable must export at least one member');
  });
`;

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const contract = await getContract(id);

    if (!contract) {
      return NextResponse.json(
        { error: `Contract '${id}' not found` },
        { status: 404 },
      );
    }

    const body = await req.json();
    const parsed = SubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const { submissionCode, testCode, actor } = parsed.data;

    // Step 1: Advance state to SUBMITTED
    // If coming from HELD, use RESUBMIT; if coming from FUNDED, use DELIVERABLE_SUBMITTED
    const submitEvent =
      contract.state === ContractState.HELD
        ? ContractEvent.RESUBMIT
        : ContractEvent.DELIVERABLE_SUBMITTED;

    const submittedState = getNextState(contract.state, submitEvent);

    // Step 2: Run verification (Test Runner + LLM Judge + Release Gate)
    const verification = await verifyDeliverable({
      contractTitle: contract.title,
      contractDescription: contract.description,
      criteria: contract.criteria,
      submissionCode,
      testCode: testCode.trim() ? testCode : DEFAULT_FALLBACK_TESTS,
    });

    // Step 3: Advance state from SUBMITTED based on verifier policy recommendation
    const finalState = getNextState(
      submittedState,
      verification.recommendedEvent,
    );

    const submissionCount = contract.submissionCount + 1;

    const updated = await updateContract(id, {
      currentSubmission: submissionCode,
      submissionCount,
      state: finalState,
    });

    // Record submission and verdict in audit log
    await appendAuditEvent(
      createAuditEvent({
        contractId: id,
        eventType: ContractEvent.DELIVERABLE_SUBMITTED,
        actor,
        details: {
          submissionNumber: submissionCount,
          recommendedEvent: verification.recommendedEvent,
          policyDecision: verification.policy.decision,
          finalState,
          testSummary: {
            passed: verification.testRun.passed,
            total: verification.testRun.totalTests,
            failed: verification.testRun.failedTests,
          },
          verdict: verification.overallVerdict,
        },
      }),
    );

    return NextResponse.json(
      {
        contract: updated,
        verification: {
          decision: verification.policy.decision,
          verdict: verification.overallVerdict,
          tests: {
            passed: verification.testRun.passed,
            total: verification.testRun.totalTests,
            failed: verification.testRun.failedTests,
            details: verification.testRun.details,
          },
          evidence: verification.overallVerdict.evidence,
        },
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API /api/contracts/[id]/submit POST]", message);
    return NextResponse.json(
      { error: "Submission verification failed", message },
      { status: 400 },
    );
  }
}
