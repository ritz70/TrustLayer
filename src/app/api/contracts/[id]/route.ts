import { NextRequest, NextResponse } from "next/server";
import { getAuditEvents, getContract } from "@/lib/db/store";

export async function GET(
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

    const auditTrail = await getAuditEvents(id);

    return NextResponse.json(
      { contract, auditTrail },
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API /api/contracts/[id] GET]", message);
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 },
    );
  }
}
