import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { appendAuditEvent, createContract, listContracts } from "@/lib/db/store";
import { createAuditEvent } from "@/lib/escrow/audit-log";
import { ContractState, type Contract } from "@/lib/types";

const CreateContractSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().default(""),
  criteria: z
    .array(
      z.object({
        id: z.string().default(() => uuidv4()),
        description: z.string().min(1, "Criterion description is required"),
        hasTest: z.boolean().default(true),
      }),
    )
    .min(1, "At least one criterion is required"),
  amountCents: z.number().int().positive("Amount must be a positive integer in cents"),
  currency: z.literal("USD").default("USD"),
  milestonePercent: z.number().int().min(1).max(100).default(100),
  clientId: z.string().min(1, "clientId is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateContractSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const {
      title,
      description,
      criteria,
      amountCents,
      currency,
      milestonePercent,
      clientId,
    } = parsed.data;

    const now = new Date().toISOString();
    const contract: Contract = {
      id: uuidv4(),
      title,
      description,
      criteria,
      amount: {
        amountCents,
        currency,
      },
      milestonePercent,
      clientId,
      freelancerId: null,
      clientAccepted: true,
      freelancerAccepted: false,
      state: ContractState.DRAFT,
      paypalOrderId: null,
      paypalAuthorizationId: null,
      currentSubmission: null,
      submissionCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await createContract(contract);

    await appendAuditEvent(
      createAuditEvent({
        contractId: saved.id,
        eventType: "CONTRACT_CREATED",
        actor: clientId,
        details: {
          title: saved.title,
          amountCents: saved.amount.amountCents,
          state: saved.state,
        },
      }),
    );

    return NextResponse.json(saved, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API /api/contracts POST]", message);
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const contracts = await listContracts();
    return NextResponse.json(contracts, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API /api/contracts GET]", message);
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 },
    );
  }
}

