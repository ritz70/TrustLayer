# TrustLayer — AI-Assisted Milestone Escrow

> **"We make 'done' checkable before money moves. AI recommends, a human decides when unsure, PayPal releases the funds."**

Built for the **PayPal AI Hackathon 2026**.

[![CI / Tests](https://img.shields.io/badge/Tests-45%2F45%20Passing-emerald?style=flat-square)](https://github.com/ritz70/TrustLayer)
[![False-Release Rate](https://img.shields.io/badge/False--Release%20Rate-0.00%25-cyan?style=flat-square)](https://github.com/ritz70/TrustLayer)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## 1. Problem & Vision

Strangers trading money for unfinished freelance work deadlock over who goes first:
* Clients worry about paying upfront for broken or incomplete work.
* Freelancers worry about finishing complex work and never getting paid.
* "Done" is rarely defined with precision upfront.

**TrustLayer** solves this deadlock through checkable code acceptance criteria and PayPal escrow:
1. **Pre-Agreed Acceptance Criteria**: Both parties agree on testable, unambiguous criteria *before* money moves.
2. **Funds Held in PayPal**: The client authorizes the payment upfront using PayPal's sandbox vault (held securely up to 29 days).
3. **Dual-Layer Verification**:
   - **Layer 1 (Deterministic)**: Automated test runner executes unit tests in an isolated, sandboxed subprocess with strict timeouts and memory limits.
   - **Layer 2 (LLM Judge)**: An AI judge inspects AST structure to catch test gaming (e.g. hardcoded `if (x === 10) return 42;`) and prompt injection attacks.
4. **Deterministic Policy Gate**: **Code strictly overrides AI.** If unit tests fail, funds are held regardless of what the LLM says. Money moves only when checks pass with high confidence ($\ge 85\%$).

---

## 2. The Golden Path (Demo Flow)

```
[1. Create Contract] ──> [2. Freelancer Accepts] ──> [3. Client Authorizes (PayPal)]
                                                                  │
                                                                  ▼
[5. Partial Capture & Payout] <── [4b. Fixed Resubmission] <── [4a. Failing Submission]
  (State: RELEASED)                  (State: RELEASABLE)           (State: HELD)
```

1. **Agreement**: Client defines criteria; freelancer accepts (`DRAFT` ➔ `AGREED`).
2. **Funding**: Client authorizes PayPal order; money is held in escrow (`AGREED` ➔ `FUNDED`).
3. **Failure First**: Freelancer submits deliverable that fails a check. Funds stay held; structured failure evidence is displayed (`FUNDED` ➔ `SUBMITTED` ➔ `HELD`).
4. **Fix & Verification**: Freelancer submits fixed code. Sandbox tests pass and LLM judge verifies genuine arithmetic (`HELD` ➔ `SUBMITTED` ➔ `RELEASABLE`).
5. **Release**: Server triggers partial capture (e.g. 70% milestone share) and payout (`RELEASABLE` ➔ `RELEASED`).

---

## 3. Architecture

```
src/
├── app/
│   ├── page.tsx                      # Dashboard overview
│   ├── create-contract/page.tsx      # Contract wizard with criteria builder
│   ├── contracts/[id]/page.tsx       # Live interactive contract workspace
│   └── api/                          # Thin Next.js Route Handlers
│       ├── contracts/                # POST create, GET list
│       ├── contracts/[id]/           # GET detail & audit log
│       ├── contracts/[id]/accept/    # POST freelancer acceptance
│       ├── contracts/[id]/fund/      # POST PayPal order authorization
│       ├── contracts/[id]/submit/    # POST code deliverable & verifier
│       ├── contracts/[id]/review/    # POST human approve/reject fallback
│       ├── contracts/[id]/release/   # POST partial capture & payout
│       └── webhooks/paypal/          # POST signature-verified webhooks
├── lib/
│   ├── types.ts                      # Shared types (Contract, State, Verdict, Money)
│   ├── escrow/                       # Pure state machine & audit log
│   ├── policy/                       # Deterministic release gate (Code > AI)
│   ├── verifier/                     # Subprocess test runner & Zod LLM judge
│   ├── paypal/                       # PayPal adapter interface & factory
│   ├── mock/                         # In-memory PayPal simulator with idempotency
│   └── db/                           # Supabase PostgreSQL client & store layer
evals/
├── labeled-submissions.ts            # 20 labeled benchmark submissions
└── run-evals.ts                      # False-release rate benchmark runner
supabase/
└── migrations/001_initial.sql        # PostgreSQL schema with Row-Level Security
```

---

## 4. Benchmark & Safety Metrics (`npm run eval`)

We evaluated TrustLayer across **20 labeled test cases** spanning 5 threat categories:

| Threat Category | Test Cases | Expected | Result | Defense Rate |
|---|---|---|---|---|
| **Clean Implementations** | 5 | RELEASE | 5 Released | 100% Auto-Approval |
| **Subtly Wrong Arithmetic** | 4 | HOLD | 4 Blocked | 100% Blocked |
| **Test-Gaming / Lookup Tables** | 4 | HOLD | 4 Blocked | 100% Blocked |
| **Prompt Injection Attacks** | 4 | HOLD | 4 Blocked | 100% Blocked |
| **Malicious Subprocess / DoS** | 3 | HOLD | 3 Blocked | 100% Blocked |

* **False-Release Rate**: **`0.00%`** (0 unauthorized releases out of 15 attack vectors).
* **DoS Protection**: Infinite loop freeze attacks are terminated via `SIGKILL` at 5,000ms.
* **Deterministic Override**: Any failing unit test forces `HOLD`, even if submitted comments instruct the AI to ignore tests.

---

## 5. Quickstart

### Prerequisites
* **Node.js**: v20 or higher
* **npm**: v10 or higher

### 1. Clone & Install
```bash
git clone https://github.com/ritz70/TrustLayer.git
cd TrustLayer
npm install
```

### 2. Environment Configuration
Copy the template to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your configuration:
```env
# --- Supabase (Hosted PostgreSQL) ---
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key

# --- PayPal Sandbox ---
PAYPAL_CLIENT_ID=your-sandbox-client-id
PAYPAL_CLIENT_SECRET=your-sandbox-client-secret
PAYPAL_API_BASE=https://api-m.sandbox.paypal.com

# --- LLM Provider (Groq / OpenAI) ---
OPENAI_API_KEY=gsk_your_groq_or_openai_api_key
OPENAI_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.3-70b-versatile

# --- App Settings ---
RELEASE_CONFIDENCE=0.85
USE_MOCK_PAYPAL=true    # Set to true for instant offline dev, false for live PayPal Sandbox
```

*(Note: If Supabase keys are omitted, TrustLayer automatically activates an in-memory persistence fallback for immediate local testing).*

### 3. Database Migration
In your Supabase project's **SQL Editor**, paste and run:
```sql
-- Located at: supabase/migrations/001_initial.sql
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 6. Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Starts local Next.js development server |
| `npm test` | Runs all 45 Vitest unit and integration tests |
| `npm run lint` | Runs ESLint and strict TypeScript type-checking |
| `npm run eval` | Runs the 20-case safety eval benchmark |
| `npm run build` | Compiles production Next.js application |

---

## 7. Security & Limitations

* **Checkable Work Only**: Scope is limited to code deliverables with automated unit test suites. Subjective, design, or writing deliverables are outside the verification scope.
* **PayPal Authorization Limits**: Funds in PayPal sandbox authorizations can be held up to 29 days, with an optimal 3-day capture honor period.
* **Server-Side Math**: Money is stored as integer cents (`amountCents`) to avoid IEEE 754 floating point errors. Milestone release amounts are calculated strictly on the server—never trusting client payloads.
* **Regulatory Notice**: This is a hackathon prototype demonstration utilizing PayPal authorizations and captures. A production marketplace holding funds would partner with a licensed escrow or money-transmitter entity.

---

## 8. License

Distributed under the [MIT License](LICENSE).
