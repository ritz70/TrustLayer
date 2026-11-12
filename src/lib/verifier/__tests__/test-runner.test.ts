import { describe, expect, it } from "vitest";
import { runDeliverableTests } from "../test-runner";

describe("Test Runner - Subprocess Isolation", () => {
  it("executes valid code and passes all tests", async () => {
    const submissionCode = `
      export function add(a, b) {
        return a + b;
      }
    `;

    const testCode = `
      await test('adds two positive numbers', (sub, assert) => {
        assert.equal(sub.add(2, 3), 5);
      });
      await test('adds negative numbers', (sub, assert) => {
        assert.equal(sub.add(-1, -1), -2);
      });
    `;

    const result = await runDeliverableTests({
      submissionCode,
      testCode,
      timeoutMs: 3000,
    });

    expect(result.passed).toBe(true);
    expect(result.totalTests).toBe(2);
    expect(result.passedTests).toBe(2);
    expect(result.failedTests).toBe(0);
    expect(result.timedOut).toBe(false);
  });

  it("catches failing tests and provides details", async () => {
    const submissionCode = `
      export function add(a, b) {
        return a * b; // Broken on purpose
      }
    `;

    const testCode = `
      await test('adds 2 and 3', (sub, assert) => {
        assert.equal(sub.add(2, 3), 5);
      });
    `;

    const result = await runDeliverableTests({
      submissionCode,
      testCode,
      timeoutMs: 3000,
    });

    expect(result.passed).toBe(false);
    expect(result.totalTests).toBe(1);
    expect(result.failedTests).toBe(1);
    expect(result.details.length).toBeGreaterThan(0);
    expect(result.details[0]).toContain("adds 2 and 3");
  });

  it("terminates infinite loops on timeout without freezing the server", async () => {
    const submissionCode = `
      export function hang() {
        while (true) {} // Infinite loop
      }
    `;

    const testCode = `
      await test('hangs forever', (sub) => {
        sub.hang();
      });
    `;

    const result = await runDeliverableTests({
      submissionCode,
      testCode,
      timeoutMs: 800, // Short timeout for test speed
    });

    expect(result.passed).toBe(false);
    expect(result.timedOut).toBe(true);
    expect(result.details[0]).toContain("exceeded timeout limit");
  });

  it("handles syntax errors gracefully", async () => {
    const submissionCode = `
      export function broken( { // Syntax error
    `;

    const testCode = `
      await test('syntax test', () => {});
    `;

    const result = await runDeliverableTests({
      submissionCode,
      testCode,
      timeoutMs: 3000,
    });

    expect(result.passed).toBe(false);
    expect(result.failedTests).toBeGreaterThan(0);
  });
});

