/**
 * PayPal adapter interface re-export.
 *
 * The interface is defined in types.ts. This file provides the factory
 * function that returns either the real or mock adapter based on config.
 */

import type { PayPalAdapter } from "@/lib/types";
import { MockPayPalAdapter } from "@/lib/mock/mock-paypal";

// Singleton mock adapter instance to maintain state across requests
const sharedMockAdapter = new MockPayPalAdapter();

/**
 * Get the PayPal adapter based on the USE_MOCK_PAYPAL environment variable.
 *
 * In production/sandbox: returns the real PayPal client.
 * In dev/test or when USE_MOCK_PAYPAL=true: returns the mock.
 */
export function getPayPalAdapter(): PayPalAdapter {
  const useMock = process.env.USE_MOCK_PAYPAL === "true";

  if (useMock) {
    return sharedMockAdapter;
  }

  // TODO: Import and return real PayPal client once payments teammate builds it.
  // For now, fall back to mock with a warning.
  console.warn(
    "[PayPal] Real PayPal client not yet available. Falling back to mock adapter.",
  );
  return sharedMockAdapter;
}
