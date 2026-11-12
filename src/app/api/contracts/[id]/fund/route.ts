import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent, getContract, updateContract } from "@/lib/db/store";
import { createAuditEvent } from "@/lib/escrow/audit-log";
import { getNextState } from "@/lib/escrow/state-machine";
import { getPayPalAdapter } from "@/lib/paypal/interface";
import { ContractEvent } from "@/lib/types";

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

    // Verify state transition is legal (AGREED -> FUNDED)
    const nextState = getNextState(contract.state, ContractEvent.ORDER_AUTHORIZED);

    // Call PayPal adapter to create order and authorize
    const paypal = getPayPalAdapter();
    const orderResult = await paypal.createOrder(contract.id, contract.amount);
    const authResult = await paypal.authorize(orderResult.orderId);

    const updated = await updateContract(id, {
      paypalOrderId: orderResult.orderId,
      paypalAuthorizationId: authResult.authorizationId,
      state: nextState,
    });

    await appendAuditEvent(
      createAuditEvent({
        contractId: id,
        eventType: ContractEvent.ORDER_AUTHORIZED,
        actor: contract.clientId,
        details: {
          previousState: contract.state,
          newState: nextState,
          paypalOrderId: orderResult.orderId,
          paypalAuthorizationId: authResult.authorizationId,
          amountCents: contract.amount.amountCents,
        },
      }),
    );

    return NextResponse.json(
      {
        contract: updated,
        approvalUrl: orderResult.approvalUrl,
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API /api/contracts/[id]/fund POST]", message);
    return NextResponse.json(
      { error: "Funding authorization failed", message },
      { status: 400 },
    );
  }
}

