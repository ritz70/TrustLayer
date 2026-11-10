import { describe, expect, it } from "vitest";
import { ContractEvent } from "@/lib/types";
import { createAuditEvent } from "../audit-log";

describe("Audit Log - Pure Factory", () => {
  it("creates a well-formed immutable audit event", () => {
    const event = createAuditEvent({
      contractId: "test-contract-123",
      eventType: ContractEvent.ORDER_AUTHORIZED,
      actor: "client-user-1",
      details: { amountCents: 50000, paypalOrderId: "PP-123" },
    });

    expect(event.id).toBeDefined();
    expect(typeof event.id).toBe("string");
    expect(event.contractId).toBe("test-contract-123");
    expect(event.eventType).toBe(ContractEvent.ORDER_AUTHORIZED);
    expect(event.actor).toBe("client-user-1");
    expect(event.details).toEqual({
      amountCents: 50000,
      paypalOrderId: "PP-123",
    });
    expect(event.createdAt).toBeDefined();
    expect(new Date(event.createdAt).getTime()).toBeGreaterThan(0);
  });

  it("freezes the event to prevent tampering", () => {
    const event = createAuditEvent({
      contractId: "test-contract-123",
      eventType: ContractEvent.DELIVERABLE_SUBMITTED,
      actor: "freelancer-user-1",
    });

    expect(Object.isFrozen(event)).toBe(true);
    expect(Object.isFrozen(event.details)).toBe(true);
  });

  it("throws if contractId is missing or empty", () => {
    expect(() =>
      createAuditEvent({
        contractId: "",
        eventType: ContractEvent.BOTH_ACCEPT,
        actor: "client-1",
      }),
    ).toThrow("Audit event requires a valid contractId");
  });

  it("throws if eventType is missing or empty", () => {
    expect(() =>
      createAuditEvent({
        contractId: "contract-1",
        eventType: "",
        actor: "client-1",
      }),
    ).toThrow("Audit event requires a valid eventType");
  });

  it("throws if actor is missing or empty", () => {
    expect(() =>
      createAuditEvent({
        contractId: "contract-1",
        eventType: ContractEvent.BOTH_ACCEPT,
        actor: "   ",
      }),
    ).toThrow("Audit event requires a valid actor");
  });

  it("supports custom id and timestamp when replaying or importing logs", () => {
    const customId = "custom-id-999";
    const customTime = "2026-11-10T12:00:00.000Z";

    const event = createAuditEvent({
      contractId: "contract-1",
      eventType: ContractEvent.PASS_HIGH_CONFIDENCE,
      actor: "system",
      id: customId,
      createdAt: customTime,
    });

    expect(event.id).toBe(customId);
    expect(event.createdAt).toBe(customTime);
  });
});
