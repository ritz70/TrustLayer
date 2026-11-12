import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST as createContractRoute } from "@/app/api/contracts/route";
import { GET as getContractRoute } from "@/app/api/contracts/[id]/route";
import { POST as acceptRoute } from "@/app/api/contracts/[id]/accept/route";
import { POST as fundRoute } from "@/app/api/contracts/[id]/fund/route";
import { POST as submitRoute } from "@/app/api/contracts/[id]/submit/route";
import { POST as releaseRoute } from "@/app/api/contracts/[id]/release/route";
import { POST as reviewRoute } from "@/app/api/contracts/[id]/review/route";
import { ContractState } from "@/lib/types";

function createMockRequest(url: string, body?: unknown): NextRequest {
  const init: ConstructorParameters<typeof NextRequest>[1] = {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
  };
  if (body) {
    init.body = JSON.stringify(body);
  }
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

describe("API Golden Path — End-to-End Flow", () => {
  it("executes the complete demo flow: Create -> Accept -> Fund -> Fail -> Fix -> Release", async () => {
    // 1. Client creates contract
    const createReq = createMockRequest("http://localhost:3000/api/contracts", {
      title: "Tax Calculator Function",
      description: "Progressive tax bracket calculator",
      criteria: [
        { description: "Exports calculateTax function", hasTest: true },
        { description: "Handles 10% bracket for <= $10k", hasTest: true },
      ],
      amountCents: 50000, // $500.00
      currency: "USD",
      milestonePercent: 70, // 70% milestone release ($350)
      clientId: "client-alice",
    });

    const createRes = await createContractRoute(createReq);
    expect(createRes.status).toBe(201);
    const contract = await createRes.json();
    const contractId = contract.id;

    expect(contract.state).toBe(ContractState.DRAFT);
    expect(contract.amount.amountCents).toBe(50000);
    expect(contract.milestonePercent).toBe(70);

    // 2. Freelancer accepts contract (DRAFT -> AGREED)
    const acceptReq = createMockRequest(
      `http://localhost:3000/api/contracts/${contractId}/accept`,
      { freelancerId: "freelancer-bob@example.com" },
    );
    const acceptRes = await acceptRoute(acceptReq, {
      params: Promise.resolve({ id: contractId }),
    });
    expect(acceptRes.status).toBe(200);
    const agreedContract = await acceptRes.json();
    expect(agreedContract.state).toBe(ContractState.AGREED);
    expect(agreedContract.freelancerId).toBe("freelancer-bob@example.com");

    // 3. Client funds contract via PayPal authorization (AGREED -> FUNDED)
    const fundReq = createMockRequest(
      `http://localhost:3000/api/contracts/${contractId}/fund`,
    );
    const fundRes = await fundRoute(fundReq, {
      params: Promise.resolve({ id: contractId }),
    });
    expect(fundRes.status).toBe(200);
    const fundData = await fundRes.json();
    expect(fundData.contract.state).toBe(ContractState.FUNDED);
    expect(fundData.contract.paypalAuthorizationId).toBeDefined();

    // 4. Freelancer submits broken deliverable that FAILS checks (FUNDED -> SUBMITTED -> HELD)
    const brokenCode = `
      export function calculateTax(income) {
        return 999999; // Incorrect implementation!
      }
    `;
    const testCode = `
      await test('calculates 10% tax on 10000', (sub, assert) => {
        assert.equal(sub.calculateTax(10000), 1000);
      });
    `;

    const failSubmitReq = createMockRequest(
      `http://localhost:3000/api/contracts/${contractId}/submit`,
      {
        submissionCode: brokenCode,
        testCode,
        actor: "freelancer-bob",
      },
    );
    const failSubmitRes = await submitRoute(failSubmitReq, {
      params: Promise.resolve({ id: contractId }),
    });
    expect(failSubmitRes.status).toBe(200);
    const failSubmitData = await failSubmitRes.json();
    expect(failSubmitData.contract.state).toBe(ContractState.HELD);
    expect(failSubmitData.verification.decision).toBe("HOLD");
    expect(failSubmitData.verification.tests.passed).toBe(false);

    // 5. Freelancer resubmits fixed deliverable that PASSES checks (HELD -> SUBMITTED -> RELEASABLE)
    const fixedCode = `
      export function calculateTax(income) {
        if (!income || income <= 0) return 0;
        return income * 0.1;
      }
    `;

    const passSubmitReq = createMockRequest(
      `http://localhost:3000/api/contracts/${contractId}/submit`,
      {
        submissionCode: fixedCode,
        testCode,
        actor: "freelancer-bob",
      },
    );
    const passSubmitRes = await submitRoute(passSubmitReq, {
      params: Promise.resolve({ id: contractId }),
    });
    expect(passSubmitRes.status).toBe(200);
    const passSubmitData = await passSubmitRes.json();
    expect(passSubmitData.contract.state).toBe(ContractState.RELEASABLE);
    expect(passSubmitData.verification.decision).toBe("RELEASE");
    expect(passSubmitData.verification.tests.passed).toBe(true);

    // 6. Server executes partial capture (70%) and simulated payout (RELEASABLE -> RELEASED)
    const releaseReq = createMockRequest(
      `http://localhost:3000/api/contracts/${contractId}/release`,
    );
    const releaseRes = await releaseRoute(releaseReq, {
      params: Promise.resolve({ id: contractId }),
    });
    expect(releaseRes.status).toBe(200);
    const releaseData = await releaseRes.json();
    expect(releaseData.contract.state).toBe(ContractState.RELEASED);

    // Verify money arithmetic: 70% of 50000 cents = 35000 cents ($350)
    expect(releaseData.capture.amount.amountCents).toBe(35000);
    expect(releaseData.payout.amount.amountCents).toBe(35000);

    // 7. Verify full contract detail and complete audit trail
    const getReq = createMockRequest(
      `http://localhost:3000/api/contracts/${contractId}`,
    );
    const getRes = await getContractRoute(getReq, {
      params: Promise.resolve({ id: contractId }),
    });
    expect(getRes.status).toBe(200);
    const detailData = await getRes.json();
    expect(detailData.contract.state).toBe(ContractState.RELEASED);

    // Verify audit log has every step recorded
    const eventTypes = detailData.auditTrail.map(
      (e: { eventType: string }) => e.eventType,
    );
    expect(eventTypes).toContain("CONTRACT_CREATED");
    expect(eventTypes).toContain("BOTH_ACCEPT");
    expect(eventTypes).toContain("ORDER_AUTHORIZED");
    expect(eventTypes).toContain("DELIVERABLE_SUBMITTED");
    expect(eventTypes).toContain("CAPTURE_PAYOUT_SUCCESS");
  });

  describe("Human Review Route", () => {
    it("allows human approval to advance from IN_REVIEW to RELEASABLE", async () => {
      // Create and prepare contract directly
      const createReq = createMockRequest("http://localhost:3000/api/contracts", {
        title: "Reviewable Contract",
        criteria: [{ description: "Qualitative requirement", hasTest: false }],
        amountCents: 10000,
        clientId: "client-alice",
      });
      const createRes = await createContractRoute(createReq);
      const contract = await createRes.json();

      // Manually set state to IN_REVIEW for testing review route
      const { updateContract } = await import("@/lib/db/store");
      await updateContract(contract.id, { state: ContractState.IN_REVIEW });

      const reviewReq = createMockRequest(
        `http://localhost:3000/api/contracts/${contract.id}/review`,
        {
          decision: "approve",
          actor: "client-alice",
          notes: "Approved after inspecting code visually",
        },
      );
      const reviewRes = await reviewRoute(reviewReq, {
        params: Promise.resolve({ id: contract.id }),
      });
      expect(reviewRes.status).toBe(200);
      const data = await reviewRes.json();
      expect(data.contract.state).toBe(ContractState.RELEASABLE);
      expect(data.decision).toBe("approve");
    });
  });
});
