/**
 * Shared types for TrustLayer — the milestone escrow system.
 *
 * This file is the team contract. Changes need a heads-up to all teammates.
 * Money is always integer minor units (cents) + currency code, never floats.
 */

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

/** Integer minor-unit amount (e.g. cents for USD). Never use floats for money. */
export interface Money {
  amountCents: number;
  currency: "USD";
}

// ---------------------------------------------------------------------------
// Contract State Machine
// ---------------------------------------------------------------------------

export enum ContractState {
  DRAFT = "DRAFT",
  AGREED = "AGREED",
  FUNDED = "FUNDED",
  SUBMITTED = "SUBMITTED",
  HELD = "HELD",
  IN_REVIEW = "IN_REVIEW",
  RELEASABLE = "RELEASABLE",
  RELEASED = "RELEASED",
  DISPUTED = "DISPUTED",
}

/** Events that drive state transitions. */
export enum ContractEvent {
  BOTH_ACCEPT = "BOTH_ACCEPT",
  ORDER_AUTHORIZED = "ORDER_AUTHORIZED",
  DELIVERABLE_SUBMITTED = "DELIVERABLE_SUBMITTED",
  PASS_HIGH_CONFIDENCE = "PASS_HIGH_CONFIDENCE",
  FAIL = "FAIL",
  UNCERTAIN = "UNCERTAIN",
  HUMAN_APPROVES = "HUMAN_APPROVES",
  HUMAN_REJECTS = "HUMAN_REJECTS",
  RESUBMIT = "RESUBMIT",
  CAPTURE_PAYOUT_SUCCESS = "CAPTURE_PAYOUT_SUCCESS",
  DISPUTE = "DISPUTE",
}

// ---------------------------------------------------------------------------
// Acceptance Criteria
// ---------------------------------------------------------------------------

/** A single checkable criterion for the deliverable. */
export interface Criterion {
  id: string;
  description: string;
  /** Whether this criterion has an automated test (vs. LLM-only check). */
  hasTest: boolean;
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export type Role = "client" | "freelancer";

export interface Contract {
  id: string;
  title: string;
  description: string;
  criteria: Criterion[];

  /** Total contract value in minor units. */
  amount: Money;
  /** Percentage of amount released on milestone completion (e.g. 70 for 70%). */
  milestonePercent: number;

  clientId: string;
  freelancerId: string | null; // null until freelancer accepts
  clientAccepted: boolean;
  freelancerAccepted: boolean;

  state: ContractState;

  /** PayPal order ID (set after funding). */
  paypalOrderId: string | null;
  /** PayPal authorization ID (set after authorization). */
  paypalAuthorizationId: string | null;

  /** The latest deliverable submission (code as string). */
  currentSubmission: string | null;
  /** Number of submissions so far. */
  submissionCount: number;

  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// ---------------------------------------------------------------------------
// Verdict (output of the verifier)
// ---------------------------------------------------------------------------

export interface Verdict {
  verdict: "pass" | "fail" | "uncertain";
  /** Confidence score 0–1. Only relevant when verdict is "pass". */
  confidence: number;
  /** Human-readable evidence items explaining the decision. */
  evidence: string[];
}

// ---------------------------------------------------------------------------
// Audit Log
// ---------------------------------------------------------------------------

export interface AuditEvent {
  id: string;
  contractId: string;
  eventType: ContractEvent | string; // ContractEvent or system events
  actor: string; // userId or "system"
  /** Additional structured data (e.g. verdict, paypal order id). */
  details: Record<string, unknown>;
  createdAt: string; // ISO 8601
}

// ---------------------------------------------------------------------------
// PayPal Adapter Interface
// ---------------------------------------------------------------------------

export interface CreateOrderResult {
  orderId: string;
  approvalUrl: string;
}

export interface AuthorizeResult {
  authorizationId: string;
  status: string;
}

export interface CaptureResult {
  captureId: string;
  status: string;
  amount: Money;
}

export interface PayoutResult {
  payoutId: string;
  status: string;
  amount: Money;
}

/**
 * PayPal adapter interface — both the real client and mock implement this.
 * All money amounts are computed server-side from the stored contract.
 */
export interface PayPalAdapter {
  /**
   * Create a PayPal order with intent AUTHORIZE.
   * @param contractId - Used as part of the idempotency key.
   * @param amount - Total amount to authorize.
   */
  createOrder(contractId: string, amount: Money): Promise<CreateOrderResult>;

  /**
   * Authorize an approved order (funds held by PayPal, up to 29 days).
   * @param orderId - The PayPal order ID.
   */
  authorize(orderId: string): Promise<AuthorizeResult>;

  /**
   * Capture funds from an authorization. Supports partial capture.
   * @param authorizationId - The authorization to capture from.
   * @param amount - The amount to capture (may be less than authorized).
   * @param idempotencyKey - Prevents duplicate captures.
   */
  capture(
    authorizationId: string,
    amount: Money,
    idempotencyKey: string,
  ): Promise<CaptureResult>;

  /**
   * Pay out funds to the freelancer.
   * May be simulated if Payouts API is not enabled.
   * @param recipientEmail - Freelancer's PayPal email.
   * @param amount - Amount to pay out.
   * @param idempotencyKey - Prevents duplicate payouts.
   */
  payout(
    recipientEmail: string,
    amount: Money,
    idempotencyKey: string,
  ): Promise<PayoutResult>;

  /**
   * Verify a PayPal webhook signature.
   * @returns true if the webhook is authentic.
   */
  verifyWebhook(headers: Record<string, string>, body: string): Promise<boolean>;
}

