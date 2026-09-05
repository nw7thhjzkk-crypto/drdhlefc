# Agent instructions — DR DHL Elite Fitness Club

This file is the permanent engineering constitution for every automated coding agent
(Jules primary, OpenCode secondary, and any other agent) working on this repository.

## Repository

- **GitHub:** `nw7thhjzkk-crypto/drdhlefc`
- **Product:** DR DHL Elite Fitness Club — gym ERP, portals, and public website
- **Security baseline commit:** `e03470b` (do not regress)

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS v4
- Supabase Auth / PostgreSQL / Storage
- Server Components
- Server Actions
- Recharts where appropriate

**Do not introduce:** Firebase, Express, Vite, Drizzle, or a parallel auth/backend architecture without explicit instruction.

## Architecture

- Exactly three roles: **Owner**, **Trainer**, **Member**.
- **Owner** is the full administrator (superset of Trainer).
- **Trainer** may operate only on members assigned via `member_trainers`.
- **Member** may operate only on their own permitted data.
- Authorization must be enforced **server-side** (Server Actions + RPCs).
- **Supabase RLS is mandatory.** UI hiding is not authorization.

## Security

- Never expose service-role keys.
- Never expose `GEMINI_API_KEY` or other provider API keys.
- Never expose Google Drive OAuth credentials.
- Never trust client-supplied authorization or member ownership IDs.
- Never weaken RLS to make a feature work.
- Private member/progress photos must never become publicly readable as the primary access model.
- No fabricated integrations.
- No fake hardware/device APIs.
- **No agent may bypass security/financial gates.**

## Database

- Preserve migrations `000008_security_hardening.sql` and `000009_store_atomicity_and_membership_financial.sql` unless a future task **explicitly** requires changing them.
- Preserve financial transaction atomicity.
- Preserve audit-log immutability (append-only; use `insert_audit_log` RPC).
- Preserve historical assessment data.
- Prefer database constraints, RPCs, and transactions for invariants that cannot safely rely on the client.
- New migrations must be forward-only with the next free number.

## Financial

- Never trust client-side prices.
- No negative stock.
- Checkout and payment operations must remain atomic.
- Avoid race conditions in inventory and payment operations.
- Prefer existing SECURITY DEFINER RPCs (`record_payment_atomic`, `checkout_store_sale`, `assign_membership`, etc.).

## AI

- Gemini (and any AI) calls must be **server-side**.
- AI output must be validated/structured before becoming application data.
- AI-created diet/workout plans are **drafts** until appropriate acceptance/assignment.
- Never expose provider API keys in code, logs, issues, PRs, or client bundles.

## Google Drive

- Drive credentials remain server-side.
- Private files must use authorization-controlled access.
- Do not expose raw OAuth credentials.
- Do not fabricate Drive URLs or IDs.
- If not configured, report that state explicitly.

## Testing

For substantial changes, run and fix:

- lint
- typecheck
- build
- relevant unit/integration tests
- authorization / RLS tests
- financial / transaction tests where applicable
- regression testing

Do not fabricate passing tests.

## Agent roles and autonomous merge

- **Jules** — primary implementation agent (features, architecture, DB, security, integrations, tests).
- **OpenCode** — secondary agent (independent review, security review, small fixes, refactoring, backup implementation).
- **GitHub Actions CI** — mandatory lint/typecheck/build for merge eligibility.
- **Guarded auto-merge** — only PRs authored by `google-labs-jules[bot]` from this repository, with green CI, no conflicts, and **no high-risk path changes**, may be automatically squash-merged.
- **Never** auto-merge arbitrary, manual, fork, or experimental PRs.
- **High-risk changes fail closed** (migrations `000008`/`000009`, workflows, `AGENTS.md`, `opencode.json`) and require human merge.
- No agent may bypass security/financial gates.

## PR #64 policy

- Do **not** blindly merge or copy PR #64.
- Selectively port useful work only after checking each change against the security baseline and migrations `000008` / `000009`.

## General

- Inspect existing code before creating new abstractions.
- Prefer minimal, maintainable changes.
- Do not silently change unrelated functionality.
- Do not rewrite the existing architecture without explicit instruction.
- When finished: inspect the diff, report validation results, open/update a PR when appropriate, and state any blockers (credentials, external config).
