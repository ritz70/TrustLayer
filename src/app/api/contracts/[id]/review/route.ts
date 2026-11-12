import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appendAuditEvent, getContract, updateContract } from "@/lib/db/store";
import { createAuditEvent } from "@/lib/escrow/audit-log";
import { getNextState } from "@/lib/escrow/state-machine";
import { ContractEvent, ContractState } from "@/lib/types";

const ReviewSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  actor: z.string().min(1, "actor is required"),
  notes: z.string().optional(),
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

    if (contract.state !== ContractState.IN_REVIEW) {
      return NextResponse.json(
        {
          error: `Contract is in state '${contract.state}', but human review requires 'IN_REVIEW'`,
        },
        { status: 400 },
      );
    }

    const body = await req.json();
    const parsed = ReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const { decision, actor, notes } = parsed.data;

    const event =
      decision === "approve"
        ? ContractEvent.HUMAN_APPROVES
        : ContractEvent.HUMAN_REJECTS;

    const nextState = getNextState(contract.state, event);
    const updated = await updateContract(id, { state: nextState });

    await appendAuditEvent(
      createAuditEvent({
        contractId: id,
        eventType: event,
        actor,
        details: {
          decision,
          notes: notes || "No additional notes provided",
          previousState: contract.state,
          newState: nextState,
        },
      }),
    );

    return NextResponse.json(
      {
        contract: updated,
        decision,
        notes,
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API /api/contracts/[id]/review POST]", message);
    return NextResponse.json(
      { error: "Review submission failed", message },
      { status: 400 },
    );
  }
}
