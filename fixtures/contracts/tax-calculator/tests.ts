/**
 * Test suite for Progressive Tax Calculator.
 * Executed inside test-runner.mjs with `(submission, assert)`.
 */

export const testCode = `
  await test('exports calculateTax function', (sub, assert) => {
    assert.equal(typeof sub.calculateTax, 'function', 'calculateTax must be an exported function');
  });

  await test('handles zero and negative income', (sub, assert) => {
    assert.equal(sub.calculateTax(0), 0);
    assert.equal(sub.calculateTax(-500), 0);
  });

  await test('bracket 1: $10,000 income taxed at 10% = $1,000', (sub, assert) => {
    assert.equal(sub.calculateTax(10000), 1000);
    assert.equal(sub.calculateTax(5000), 500);
  });

  await test('bracket 2: $30,000 income = $1,000 + 20% of $20,000 = $5,000', (sub, assert) => {
    assert.equal(sub.calculateTax(30000), 5000);
    assert.equal(sub.calculateTax(50000), 9000);
  });

  // Hidden test to resist hardcoded gaming
  await test('bracket 3: $80,000 income = $9,000 + 30% of $30,000 = $18,000', (sub, assert) => {
    assert.equal(sub.calculateTax(80000), 18000);
    assert.equal(sub.calculateTax(100000), 24000);
  });
`;

