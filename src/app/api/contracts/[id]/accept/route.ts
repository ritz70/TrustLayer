import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appendAuditEvent, getContract, updateContract } from "@/lib/db/store";
import { createAuditEvent } from "@/lib/escrow/audit-log";
import { getNextState } from "@/lib/escrow/state-machine";
import { ContractEvent } from "@/lib/types";

const AcceptSchema = z.object({
  freelancerId: z.string().min(1, "freelancerId is required"),
});

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
    const parsed = AcceptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const { freelancerId } = parsed.data;

    // Enforce strict state machine turnstile
    const nextState = getNextState(contract.state, ContractEvent.BOTH_ACCEPT);

    const updated = await updateContract(id, {
      freelancerId,
      freelancerAccepted: true,
      state: nextState,
    });

    await appendAuditEvent(
      createAuditEvent({
        contractId: id,
        eventType: ContractEvent.BOTH_ACCEPT,
        actor: freelancerId,
        details: {
          previousState: contract.state,
          newState: nextState,
          freelancerId,
        },
      }),
    );

    return NextResponse.json(updated, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API /api/contracts/[id]/accept POST]", message);
    return NextResponse.json(
      { error: "State transition or update failed", message },
      { status: 400 },
    );
  }
}

