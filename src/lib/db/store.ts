/**
 * Persistence layer — contract and audit event CRUD via Supabase.
 *
 * All DB access goes through this module. The rest of the codebase
 * never imports Supabase directly.
 */

import { getSupabaseClient } from "./client";
import type { Contract, AuditEvent, ContractState } from "@/lib/types";

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

export async function createContract(
  contract: Contract,
): Promise<Contract> {
  const db = getSupabaseClient();
  const row = contractToRow(contract);
  const { data, error } = await db.from("contracts").insert(row).select().single();
  if (error) throw new Error(`Failed to create contract: ${error.message}`);
  return rowToContract(data);
}

export async function getContract(id: string): Promise<Contract | null> {
  const db = getSupabaseClient();
  const { data, error } = await db
    .from("contracts")
    .select()
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw new Error(`Failed to get contract: ${error.message}`);
  }
  return rowToContract(data);
}

export async function listContracts(): Promise<Contract[]> {
  const db = getSupabaseClient();
  const { data, error } = await db
    .from("contracts")
    .select()
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to list contracts: ${error.message}`);
  return (data ?? []).map(rowToContract);
}

export async function updateContract(
  id: string,
  updates: Partial<Contract>,
): Promise<Contract> {
  const db = getSupabaseClient();
  const row = contractToRow({ ...updates, id } as Contract);
  // Only include defined fields in the update
  const updateRow: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value !== undefined && key !== "id") {
      updateRow[key] = value;
    }
  }
  updateRow["updated_at"] = new Date().toISOString();

  const { data, error } = await db
    .from("contracts")
    .update(updateRow)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`Failed to update contract: ${error.message}`);
  return rowToContract(data);
}

// ---------------------------------------------------------------------------
// Audit Events
// ---------------------------------------------------------------------------

export async function appendAuditEvent(event: AuditEvent): Promise<void> {
  const db = getSupabaseClient();
  const { error } = await db.from("audit_events").insert({
    id: event.id,
    contract_id: event.contractId,
    event_type: event.eventType,
    actor: event.actor,
    details: event.details,
    created_at: event.createdAt,
  });
  if (error) throw new Error(`Failed to append audit event: ${error.message}`);
}

export async function getAuditEvents(contractId: string): Promise<AuditEvent[]> {
  const db = getSupabaseClient();
  const { data, error } = await db
    .from("audit_events")
    .select()
    .eq("contract_id", contractId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Failed to get audit events: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id,
    contractId: row.contract_id,
    eventType: row.event_type,
    actor: row.actor,
    details: row.details ?? {},
    createdAt: row.created_at,
  }));
}

// ---------------------------------------------------------------------------
// Row <-> Domain mappers
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any -- DB row shapes are dynamic */
function contractToRow(c: Contract): Record<string, unknown> {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    criteria: c.criteria,
    amount_cents: c.amount?.amountCents,
    currency: c.amount?.currency,
    milestone_percent: c.milestonePercent,
    client_id: c.clientId,
    freelancer_id: c.freelancerId,
    client_accepted: c.clientAccepted,
    freelancer_accepted: c.freelancerAccepted,
    state: c.state,
    paypal_order_id: c.paypalOrderId,
    paypal_authorization_id: c.paypalAuthorizationId,
    current_submission: c.currentSubmission,
    submission_count: c.submissionCount,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  };
}

function rowToContract(row: any): Contract {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    criteria: row.criteria ?? [],
    amount: {
      amountCents: row.amount_cents,
      currency: row.currency ?? "USD",
    },
    milestonePercent: row.milestone_percent,
    clientId: row.client_id,
    freelancerId: row.freelancer_id,
    clientAccepted: row.client_accepted,
    freelancerAccepted: row.freelancer_accepted,
    state: row.state as ContractState,
    paypalOrderId: row.paypal_order_id,
    paypalAuthorizationId: row.paypal_authorization_id,
    currentSubmission: row.current_submission,
    submissionCount: row.submission_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

