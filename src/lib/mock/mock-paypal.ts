/**
 * Mock PayPal adapter — in-memory implementation of PayPalAdapter.
 *
 * Used for development, testing, and demo fallback when sandbox is unavailable.
 * Implements the exact same interface as the real PayPal client.
 */

import { v4 as uuidv4 } from "uuid";
import type {
  PayPalAdapter,
  Money,
  CreateOrderResult,
  AuthorizeResult,
  CaptureResult,
  PayoutResult,
} from "@/lib/types";

interface MockOrder {
  orderId: string;
  amount: Money;
  status: "CREATED" | "APPROVED" | "AUTHORIZED" | "CAPTURED";
  authorizationId: string | null;
  capturedAmount: number; // cents captured so far
}

export class MockPayPalAdapter implements PayPalAdapter {
  private orders: Map<string, MockOrder> = new Map();
  private processedKeys: Set<string> = new Set();

  async createOrder(contractId: string, amount: Money): Promise<CreateOrderResult> {
    const orderId = `MOCK-ORDER-${uuidv4().slice(0, 8)}`;
    this.orders.set(orderId, {
      orderId,
      amount,
      status: "CREATED",
      authorizationId: null,
      capturedAmount: 0,
    });

    return {
      orderId,
      // In real PayPal, this URL opens the approval flow in the buyer's browser.
      approvalUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${orderId}`,
    };
  }

  async authorize(orderId: string): Promise<AuthorizeResult> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Mock PayPal: order ${orderId} not found`);
    }
    if (order.status !== "CREATED" && order.status !== "APPROVED") {
      throw new Error(
        `Mock PayPal: order ${orderId} cannot be authorized in status ${order.status}`,
      );
    }

    const authorizationId = `MOCK-AUTH-${uuidv4().slice(0, 8)}`;
    order.status = "AUTHORIZED";
    order.authorizationId = authorizationId;

    return {
      authorizationId,
      status: "AUTHORIZED",
    };
  }

  async capture(
    authorizationId: string,
    amount: Money,
    idempotencyKey: string,
  ): Promise<CaptureResult> {
    // Idempotency: if we've seen this key before, return a consistent result
    if (this.processedKeys.has(idempotencyKey)) {
      return {
        captureId: `MOCK-CAP-${idempotencyKey.slice(0, 8)}`,
        status: "COMPLETED",
        amount,
      };
    }

    const order = this.findOrderByAuth(authorizationId);
    if (!order) {
      throw new Error(`Mock PayPal: authorization ${authorizationId} not found`);
    }
    if (order.status !== "AUTHORIZED") {
      throw new Error(
        `Mock PayPal: cannot capture authorization in status ${order.status}`,
      );
    }

    const remainingCents = order.amount.amountCents - order.capturedAmount;
    if (amount.amountCents > remainingCents) {
      throw new Error(
        `Mock PayPal: capture amount (${amount.amountCents}) exceeds remaining authorized amount (${remainingCents})`,
      );
    }

    order.capturedAmount += amount.amountCents;
    if (order.capturedAmount >= order.amount.amountCents) {
      order.status = "CAPTURED";
    }

    this.processedKeys.add(idempotencyKey);

    return {
      captureId: `MOCK-CAP-${uuidv4().slice(0, 8)}`,
      status: "COMPLETED",
      amount,
    };
  }

  async payout(
    recipientEmail: string,
    amount: Money,
    idempotencyKey: string,
  ): Promise<PayoutResult> {
    // Idempotency check
    if (this.processedKeys.has(idempotencyKey)) {
      return {
        payoutId: `MOCK-PAYOUT-${idempotencyKey.slice(0, 8)}`,
        status: "SUCCESS",
        amount,
      };
    }

    // Simulate payout — in production this would use the PayPal Payouts API.
    this.processedKeys.add(idempotencyKey);

    return {
      payoutId: `MOCK-PAYOUT-${uuidv4().slice(0, 8)}`,
      status: "SUCCESS",
      amount,
    };
  }

  async verifyWebhook(
    _headers: Record<string, string>,
    _body: string,
  ): Promise<boolean> {
    // Mock always verifies successfully
    return true;
  }

  // --- Test helpers (not part of the PayPalAdapter interface) ---

  /** Simulate buyer approving the order (clicking "Pay" in PayPal UI). */
  simulateApproval(orderId: string): void {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Mock PayPal: order ${orderId} not found`);
    }
    order.status = "APPROVED";
  }

  /** Get the current state of a mock order (for test assertions). */
  getOrder(orderId: string): MockOrder | undefined {
    return this.orders.get(orderId);
  }

  /** Reset all state (for test isolation). */
  reset(): void {
    this.orders.clear();
    this.processedKeys.clear();
  }

  private findOrderByAuth(authorizationId: string): MockOrder | undefined {
    for (const order of this.orders.values()) {
      if (order.authorizationId === authorizationId) {
        return order;
      }
    }
    return undefined;
  }
}

