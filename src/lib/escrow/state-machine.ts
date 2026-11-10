/**
 * Pure state machine for contract lifecycle.
 *
 * Implements transitions specified in AGENTS.md.
 * No implicit transitions. Illegal transitions throw IllegalStateTransitionError.
 * This is pure logic with zero I/O or side effects.
 */

import { ContractEvent, ContractState } from "@/lib/types";

export class IllegalStateTransitionError extends Error {
  readonly fromState: ContractState;
  readonly event: ContractEvent;

  constructor(fromState: ContractState, event: ContractEvent) {
    super(
      `Illegal transition: cannot transition from state '${fromState}' on event '${event}'`,
    );
    this.name = "IllegalStateTransitionError";
    this.fromState = fromState;
    this.event = event;
  }
}

/**
 * Transition lookup table: maps current state and event to next state.
 */
const TRANSITION_TABLE: Record<
  ContractState,
  Partial<Record<ContractEvent, ContractState>>
> = {
  [ContractState.DRAFT]: {
    [ContractEvent.BOTH_ACCEPT]: ContractState.AGREED,
    [ContractEvent.DISPUTE]: ContractState.DISPUTED,
  },
  [ContractState.AGREED]: {
    [ContractEvent.ORDER_AUTHORIZED]: ContractState.FUNDED,
    [ContractEvent.DISPUTE]: ContractState.DISPUTED,
  },
  [ContractState.FUNDED]: {
    [ContractEvent.DELIVERABLE_SUBMITTED]: ContractState.SUBMITTED,
    [ContractEvent.DISPUTE]: ContractState.DISPUTED,
  },
  [ContractState.SUBMITTED]: {
    [ContractEvent.PASS_HIGH_CONFIDENCE]: ContractState.RELEASABLE,
    [ContractEvent.FAIL]: ContractState.HELD,
    [ContractEvent.UNCERTAIN]: ContractState.IN_REVIEW,
    [ContractEvent.DISPUTE]: ContractState.DISPUTED,
  },
  [ContractState.HELD]: {
    [ContractEvent.RESUBMIT]: ContractState.SUBMITTED,
    [ContractEvent.DISPUTE]: ContractState.DISPUTED,
  },
  [ContractState.IN_REVIEW]: {
    [ContractEvent.HUMAN_APPROVES]: ContractState.RELEASABLE,
    [ContractEvent.HUMAN_REJECTS]: ContractState.HELD,
    [ContractEvent.DISPUTE]: ContractState.DISPUTED,
  },
  [ContractState.RELEASABLE]: {
    [ContractEvent.CAPTURE_PAYOUT_SUCCESS]: ContractState.RELEASED,
    [ContractEvent.DISPUTE]: ContractState.DISPUTED,
  },
  [ContractState.RELEASED]: {
    [ContractEvent.DISPUTE]: ContractState.DISPUTED,
  },
  [ContractState.DISPUTED]: {
    // Terminal state in the prototype
  },
};

/**
 * Compute the next state given a current state and event.
 * Throws IllegalStateTransitionError if the transition is not allowed.
 */
export function getNextState(
  currentState: ContractState,
  event: ContractEvent,
): ContractState {
  const allowedTransitions = TRANSITION_TABLE[currentState];
  const nextState = allowedTransitions ? allowedTransitions[event] : undefined;

  if (!nextState) {
    throw new IllegalStateTransitionError(currentState, event);
  }

  return nextState;
}

/**
 * Check whether a transition is permitted without throwing.
 */
export function canTransition(
  currentState: ContractState,
  event: ContractEvent,
): boolean {
  const allowedTransitions = TRANSITION_TABLE[currentState];
  return Boolean(allowedTransitions && allowedTransitions[event]);
}

/**
 * Get all events allowed from the current state.
 */
export function getAllowedEvents(currentState: ContractState): ContractEvent[] {
  const allowed = TRANSITION_TABLE[currentState];
  if (!allowed) {
    return [];
  }
  return Object.keys(allowed) as ContractEvent[];
}

