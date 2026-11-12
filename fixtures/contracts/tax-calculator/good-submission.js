/**
 * Valid, genuine implementation of calculateTax.
 */
export function calculateTax(income) {
  if (typeof income !== "number" || isNaN(income) || income <= 0) {
    return 0;
  }

  let tax = 0;

  // Bracket 1: 0 - 10,000 @ 10%
  const b1 = Math.min(income, 10000);
  tax += b1 * 0.1;

  // Bracket 2: 10,001 - 50,000 @ 20%
  if (income > 10000) {
    const b2 = Math.min(income - 10000, 40000);
    tax += b2 * 0.2;
  }

  // Bracket 3: > 50,000 @ 30%
  if (income > 50000) {
    const b3 = income - 50000;
    tax += b3 * 0.3;
  }

  return Math.round(tax * 100) / 100;
}

