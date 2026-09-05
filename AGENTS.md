# Agent instructions — DR DHL Elite Fitness Club

These instructions apply to OpenCode and any other automated coding agent working on this repository via GitHub Actions or CLI.

## Repository

- **GitHub:** `nw7thhjzkk-crypto/drdhlefc`
- **Product:** DR DHL Elite Fitness Club — gym ERP, portals, and public website

## Security baseline (do not regress)

- **Baseline commit:** `e03470b` (`feat: complete ERP foundation and security hardening milestone`)
- Treat this commit as the security floor for RLS, payments, POS, booking, and audit logging.
- **Preserve these migrations byte-for-byte** (never rewrite, delete, or “replace” them):
  - `supabase/migrations/000008_security_hardening.sql`
  - `supabase/migrations/000009_store_atomicity_and_membership_financial.sql`
- New migrations must use the **next free number** (e.g. `000010_...sql`) and must be forward-only.

## Stack (do not replace)

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase SSR / Auth / PostgreSQL / Storage
- Recharts
- Server Components and Server Actions

**Do not introduce:** Express, Vite, Firebase, Drizzle, or a parallel backend framework.

## Roles

Exactly three application roles:

1. **Owner** — full administrator; superset of Trainer; complete administrative authority
2. **Trainer** — only assigned members via `member_trainers`
3. **Member** — only their own data

## Authorization rules

- Enforce **UI checks, Server Action checks, and Supabase RLS**. Hiding a button is not authorization.
- Trainer access must be limited to members linked through active `member_trainers` rows.
- Member access must be limited to rows owned by their `profile_id` / member record.
- Never trust client-supplied `member_id`, `trainer_id`, or `profile_id` for authorization. Derive identity from `auth.uid()` / `getUser()` and server-side lookups.
- Prefer SECURITY DEFINER RPCs already in the database for:
  - activity booking / cancel (`book_activity_for_member`, `cancel_activity_booking`)
  - payments (`record_payment_atomic`)
  - membership assignment (`assign_membership`)
  - POS checkout (`checkout_store_sale`)
  - audit writes (`insert_audit_log`)

## Hard prohibitions (never reintroduce)

- Public member/progress photo buckets or public object URLs as the primary access model
- Client-controlled membership prices, payment amounts, or POS line prices
- Client-controlled booking identity (e.g. `bookActivity(activity_id, member_id)` from the client)
- Direct `audit_logs` INSERT/UPDATE/DELETE from application code (always use `insert_audit_log` RPC)
- Unsafe trainer-wide access to unassigned members
- Negative inventory or non-atomic stock/payment updates
- Fake/stub integrations presented as working (Gemini, Google Drive, payments, biometrics, etc.)
- Hardcoded gym identity where DB-backed settings are expected
- Exposed API credentials, service-role keys, or secrets in client bundles, comments, or logs

## Integrations

- Integrations must be **real** or **explicitly reported as not configured**.
- Covered integrations: Gemini, Google Drive, future payment provider, future biometric/device attendance.
- Server secrets stay server-only (`GEMINI_API_KEY`, `GOOGLE_DRIVE_*`, `SUPABASE_SERVICE_ROLE_KEY`, etc.).
- Never print, echo, or embed secrets in issues, PR comments, logs, or commits.

## Financial / POS / inventory

- All important financial values are authoritative server-side or database-side.
- Payments and POS must remain transactional; use existing atomic RPCs.
- Do not bypass overpayment checks, stock locks, or server-side price derivation.

## Audit logs

- Append-only for normal users.
- Actor identity must come from authenticated server context (`insert_audit_log` sets `actor_profile_id` from `auth.uid()`).
- Do not spoof actor identity from the client.

## PR #64 policy

- **Do not blindly merge or copy PR #64.**
- Selectively port useful functionality (real Gemini, real Drive, DB settings, UUID filenames, related UI) **only after** checking each change against baseline `e03470b` and migrations `000008` / `000009`.
- Never port the insecure booking or direct `audit_logs` write patterns from that PR.

## Product scope (context — implement only the requested task)

Owner dashboard/admin, Trainer portal, Member portal/PWA, public premium gym website, memberships, payments, receipts, assessments/progress, diet plans, workout plans, activities/bookings, attendance, CRM/leads, POS/store/inventory, notifications, audit logs, Google Drive file storage, Gemini AI, PWA/installability, responsive mobile-first Trainer/Member UX, desktop-first responsive Owner UX, strong RLS/server authorization, and tests.

Do **not** invent hardware APIs, payment APIs, biometric APIs, awards, statistics, testimonials, facilities, trainers, or business facts that are not in the repo or task.

## Quality bar for every task

1. Read existing code and migrations before editing.
2. Prefer minimal, focused diffs; do not modify unrelated functionality.
3. After meaningful changes, run appropriate lint / typecheck / build / tests.
4. Fix failures; do not hide them.
5. When finished:
   - inspect the diff
   - report what was validated and what failed
   - commit with a meaningful message
   - create or update a PR when working via GitHub automation
   - clearly state anything blocked by missing credentials or external configuration

## GitHub automation triggers

- Agents invoked via GitHub Actions should respond to owner comments containing `/oc` or `/opencode`.
- Follow the task in the comment; do not expand into a full ERP rewrite unless explicitly asked.
