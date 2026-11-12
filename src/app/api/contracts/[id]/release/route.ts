import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent, getContract, updateContract } from "@/lib/db/store";
import { createAuditEvent } from "@/lib/escrow/audit-log";
import { getNextState } from "@/lib/escrow/state-machine";
import { getPayPalAdapter } from "@/lib/paypal/interface";
import { ContractEvent, ContractState, type Money } from "@/lib/types";

export async function POST(
  _req: NextRequest,
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

    if (contract.state !== ContractState.RELEASABLE) {
      return NextResponse.json(
        {
          error: `Contract is in state '${contract.state}', but release requires 'RELEASABLE'`,
        },
        { status: 400 },
      );
    }

    if (!contract.paypalAuthorizationId) {
      return NextResponse.json(
        { error: "Contract does not have a valid PayPal authorization" },
        { status: 400 },
      );
    }

    // Server-side calculation of milestone release amount. NEVER trust client-sent values.
    const milestoneCents = Math.floor(
      (contract.amount.amountCents * contract.milestonePercent) / 100,
    );

    const captureAmount: Money = {
      amountCents: milestoneCents,
      currency: "USD",
    };

    const paypal = getPayPalAdapter();

    // Idempotency keys bound to contract id, action, and submission cycle
    const captureKey = `${contract.id}-capture-${contract.submissionCount}`;
    const payoutKey = `${contract.id}-payout-${contract.submissionCount}`;

    // Step 1: Capture milestone share from PayPal authorization
    const captureResult = await paypal.capture(
      contract.paypalAuthorizationId,
      captureAmount,
      captureKey,
    );

    // Step 2: Pay out to freelancer (simulated or real Payouts API)
    const recipientEmail =
      contract.freelancerId && contract.freelancerId.includes("@")
        ? contract.freelancerId
        : "freelancer-payout@example.com";

    const payoutResult = await paypal.payout(
      recipientEmail,
      captureAmount,
      payoutKey,
    );

    // Step 3: Advance state machine
    const nextState = getNextState(
      contract.state,
      ContractEvent.CAPTURE_PAYOUT_SUCCESS,
    );

    const updated = await updateContract(id, { state: nextState });

    // Step 4: Record audit event
    await appendAuditEvent(
      createAuditEvent({
        contractId: id,
        eventType: ContractEvent.CAPTURE_PAYOUT_SUCCESS,
        actor: "system",
        details: {
          previousState: contract.state,
          newState: nextState,
          captureId: captureResult.captureId,
          payoutId: payoutResult.payoutId,
          amountCents: milestoneCents,
          milestonePercent: contract.milestonePercent,
          totalCents: contract.amount.amountCents,
        },
      }),
    );

    return NextResponse.json(
      {
        contract: updated,
        capture: captureResult,
        payout: payoutResult,
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API /api/contracts/[id]/release POST]", message);
    return NextResponse.json(
      { error: "Release execution failed", message },
      { status: 500 },
    );
  }
}
