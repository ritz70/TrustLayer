/**
 * Audit log utilities.
 *
 * Provides factory functions for structured, typed audit events.
 * Pure logic — persistence is handled separately by the store layer.
 */

import { v4 as uuidv4 } from "uuid";
import type { AuditEvent, ContractEvent } from "@/lib/types";

export interface CreateAuditEventParams {
  contractId: string;
  eventType: ContractEvent | string;
  actor: string;
  details?: Record<string, unknown>;
  id?: string;
  createdAt?: string;
}

/**
 * Creates an immutable AuditEvent object.
 */
export function createAuditEvent(params: CreateAuditEventParams): AuditEvent {
  const { contractId, eventType, actor, details = {}, id, createdAt } = params;

  if (!contractId || contractId.trim() === "") {
    throw new Error("Audit event requires a valid contractId");
  }

  if (!eventType || String(eventType).trim() === "") {
    throw new Error("Audit event requires a valid eventType");
  }

  if (!actor || actor.trim() === "") {
    throw new Error("Audit event requires a valid actor");
  }

  return Object.freeze({
    id: id ?? uuidv4(),
    contractId: contractId.trim(),
    eventType,
    actor: actor.trim(),
    details: Object.freeze({ ...details }),
    createdAt: createdAt ?? new Date().toISOString(),
  });
}

