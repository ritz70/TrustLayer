import { describe, expect, it } from "vitest";
import { ContractEvent, ContractState } from "@/lib/types";
import {
  canTransition,
  getAllowedEvents,
  getNextState,
  IllegalStateTransitionError,
} from "../state-machine";

describe("State Machine - Pure Transitions", () => {
  describe("Golden path transitions", () => {
    it("follows the full demo flow correctly", () => {
      // 1. DRAFT -> BOTH_ACCEPT -> AGREED
      let state = ContractState.DRAFT;
      state = getNextState(state, ContractEvent.BOTH_ACCEPT);
      expect(state).toBe(ContractState.AGREED);

      // 2. AGREED -> ORDER_AUTHORIZED -> FUNDED
      state = getNextState(state, ContractEvent.ORDER_AUTHORIZED);
      expect(state).toBe(ContractState.FUNDED);

      // 3. FUNDED -> DELIVERABLE_SUBMITTED -> SUBMITTED
      state = getNextState(state, ContractEvent.DELIVERABLE_SUBMITTED);
      expect(state).toBe(ContractState.SUBMITTED);

      // 4. SUBMITTED -> FAIL -> HELD
      state = getNextState(state, ContractEvent.FAIL);
      expect(state).toBe(ContractState.HELD);

      // 5. HELD -> RESUBMIT -> SUBMITTED
      state = getNextState(state, ContractEvent.RESUBMIT);
      expect(state).toBe(ContractState.SUBMITTED);

      // 6. SUBMITTED -> PASS_HIGH_CONFIDENCE -> RELEASABLE
      state = getNextState(state, ContractEvent.PASS_HIGH_CONFIDENCE);
      expect(state).toBe(ContractState.RELEASABLE);

      // 7. RELEASABLE -> CAPTURE_PAYOUT_SUCCESS -> RELEASED
      state = getNextState(state, ContractEvent.CAPTURE_PAYOUT_SUCCESS);
      expect(state).toBe(ContractState.RELEASED);
    });
  });

  describe("Human review flow", () => {
    it("handles SUBMITTED -> UNCERTAIN -> IN_REVIEW -> HUMAN_APPROVES -> RELEASABLE", () => {
      let state = ContractState.SUBMITTED;
      state = getNextState(state, ContractEvent.UNCERTAIN);
      expect(state).toBe(ContractState.IN_REVIEW);

      state = getNextState(state, ContractEvent.HUMAN_APPROVES);
      expect(state).toBe(ContractState.RELEASABLE);
    });

    it("handles SUBMITTED -> UNCERTAIN -> IN_REVIEW -> HUMAN_REJECTS -> HELD -> RESUBMIT", () => {
      let state = ContractState.SUBMITTED;
      state = getNextState(state, ContractEvent.UNCERTAIN);
      expect(state).toBe(ContractState.IN_REVIEW);

      state = getNextState(state, ContractEvent.HUMAN_REJECTS);
      expect(state).toBe(ContractState.HELD);

      state = getNextState(state, ContractEvent.RESUBMIT);
      expect(state).toBe(ContractState.SUBMITTED);
    });
  });

  describe("Dispute transitions", () => {
    const disputableStates: ContractState[] = [
      ContractState.DRAFT,
      ContractState.AGREED,
      ContractState.FUNDED,
      ContractState.SUBMITTED,
      ContractState.HELD,
      ContractState.IN_REVIEW,
      ContractState.RELEASABLE,
      ContractState.RELEASED,
    ];

    it.each(disputableStates)(
      "allows DISPUTE from state %s -> DISPUTED",
      (startState) => {
        expect(canTransition(startState, ContractEvent.DISPUTE)).toBe(true);
        expect(getNextState(startState, ContractEvent.DISPUTE)).toBe(
          ContractState.DISPUTED,
        );
      },
    );
  });

  describe("Illegal transitions throw", () => {
    it("throws IllegalStateTransitionError when trying to release an unfunded contract", () => {
      expect(() =>
        getNextState(ContractState.DRAFT, ContractEvent.CAPTURE_PAYOUT_SUCCESS),
      ).toThrow(IllegalStateTransitionError);
    });

    it("throws when trying to submit deliverable to an agreed but unfunded contract", () => {
      expect(() =>
        getNextState(ContractState.AGREED, ContractEvent.DELIVERABLE_SUBMITTED),
      ).toThrow(IllegalStateTransitionError);
    });

    it("throws when trying to capture a held deliverable without pass", () => {
      expect(() =>
        getNextState(ContractState.HELD, ContractEvent.CAPTURE_PAYOUT_SUCCESS),
      ).toThrow(IllegalStateTransitionError);
    });

    it("throws when trying to human-approve a contract that is not IN_REVIEW", () => {
      expect(() =>
        getNextState(ContractState.SUBMITTED, ContractEvent.HUMAN_APPROVES),
      ).toThrow(IllegalStateTransitionError);
    });

    it("contains structured error metadata", () => {
      try {
        getNextState(ContractState.DRAFT, ContractEvent.HUMAN_APPROVES);
        expect.unreachable("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(IllegalStateTransitionError);
        const transitionErr = err as IllegalStateTransitionError;
        expect(transitionErr.fromState).toBe(ContractState.DRAFT);
        expect(transitionErr.event).toBe(ContractEvent.HUMAN_APPROVES);
        expect(transitionErr.message).toContain("cannot transition from state 'DRAFT'");
      }
    });
  });

  describe("canTransition & getAllowedEvents", () => {
    it("correctly identifies allowed vs prohibited transitions", () => {
      expect(canTransition(ContractState.FUNDED, ContractEvent.DELIVERABLE_SUBMITTED)).toBe(
        true,
      );
      expect(canTransition(ContractState.FUNDED, ContractEvent.CAPTURE_PAYOUT_SUCCESS)).toBe(
        false,
      );
    });

    it("lists valid events for SUBMITTED state", () => {
      const allowed = getAllowedEvents(ContractState.SUBMITTED);
      expect(allowed).toContain(ContractEvent.PASS_HIGH_CONFIDENCE);
      expect(allowed).toContain(ContractEvent.FAIL);
      expect(allowed).toContain(ContractEvent.UNCERTAIN);
      expect(allowed).toContain(ContractEvent.DISPUTE);
      expect(allowed).not.toContain(ContractEvent.CAPTURE_PAYOUT_SUCCESS);
    });
  });
});

