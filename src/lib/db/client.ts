/**
 * Supabase client initialization.
 *
 * Uses the service role key for server-side operations (never exposed to client).
 * Environment variables are validated at import time.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Check your .env file.`,
    );
  }
  return value;
}

let supabase: SupabaseClient | null = null;

/**
 * Get the singleton Supabase client.
 * Lazy-initialized to avoid crashing at import time during tests.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(
      getEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
      getEnvVar("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }
  return supabase;
}

