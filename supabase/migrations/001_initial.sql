-- TrustLayer: Initial schema for Supabase (PostgreSQL)
-- Tables: contracts, audit_events

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  criteria        JSONB NOT NULL DEFAULT '[]'::jsonb,

  amount_cents    INTEGER NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'USD',
  milestone_percent INTEGER NOT NULL DEFAULT 100,

  client_id       TEXT NOT NULL,
  freelancer_id   TEXT,
  client_accepted BOOLEAN NOT NULL DEFAULT false,
  freelancer_accepted BOOLEAN NOT NULL DEFAULT false,

  state           TEXT NOT NULL DEFAULT 'DRAFT',

  paypal_order_id         TEXT,
  paypal_authorization_id TEXT,

  current_submission TEXT,
  submission_count   INTEGER NOT NULL DEFAULT 0,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit events table (append-only log)
CREATE TABLE IF NOT EXISTS audit_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id     UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,
  actor           TEXT NOT NULL,
  details         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast audit log queries by contract
CREATE INDEX IF NOT EXISTS idx_audit_events_contract_id
  ON audit_events(contract_id);

-- Index for contract state queries
CREATE INDEX IF NOT EXISTS idx_contracts_state
  ON contracts(state);

-- Row-level security (enable but keep permissive for prototype)
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (our API uses service role key)
CREATE POLICY "Service role full access on contracts"
  ON contracts FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on audit_events"
  ON audit_events FOR ALL
  USING (true)
  WITH CHECK (true);

