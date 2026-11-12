import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/db/store";
import { createAuditEvent } from "@/lib/escrow/audit-log";
import { getPayPalAdapter } from "@/lib/paypal/interface";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const headersList: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headersList[key.toLowerCase()] = value;
    });

    const paypal = getPayPalAdapter();
    const isValid = await paypal.verifyWebhook(headersList, rawBody);

    if (!isValid) {
      console.warn("[PayPal Webhook] Signature verification failed");
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 },
      );
    }

    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = { raw: rawBody };
    }

    const eventType = String(payload.event_type || "PAYPAL_WEBHOOK");
    const resource = (payload.resource as Record<string, unknown>) || {};
    const contractId = String(
      resource.custom_id || resource.invoice_id || "global",
    );

    // If resource is tied to a specific contract, log to audit trail
    if (contractId && contractId !== "global") {
      try {
        await appendAuditEvent(
          createAuditEvent({
            contractId,
            eventType: `WEBHOOK_${eventType}`,
            actor: "paypal_webhook",
            details: {
              paypalEventId: payload.id,
              eventType,
              resourceType: payload.resource_type,
            },
          }),
        );
      } catch (logErr) {
        console.warn("[PayPal Webhook] Audit append note:", logErr);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API /api/webhooks/paypal POST]", message);
    return NextResponse.json(
      { error: "Webhook processing error", message },
      { status: 500 },
    );
  }
}
