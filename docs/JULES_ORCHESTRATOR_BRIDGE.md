# Jules Orchestrator Bridge

Secure service-to-service bridge so an external authorized orchestrator (e.g. ChatGPT with HTTPS tools) can submit development tasks without exposing `JULES_API_KEY`.

## Flow

```
External orchestrator
  → HTTPS + Bearer ORCHESTRATOR_SHARED_SECRET
  → Supabase Edge Function jules-orchestrator
  → Jules API (AUTO_CREATE_PR)
  → Jules PR
  → CI (lint-typecheck-build)
  → auto-merge-jules (guarded)
  → production branch
```

## Fixed targets (not caller-controlled)

| Field | Value |
|-------|--------|
| Repository | `nw7thhjzkk-crypto/drdhlefc` |
| Branch | `scaffold-gymsmart-erp-9743545895368865022` |
| Jules source | `sources/github/nw7thhjzkk-crypto/drdhlefc` |
| Automation | `AUTO_CREATE_PR` |

## Authentication

```http
Authorization: Bearer <ORCHESTRATOR_SHARED_SECRET>
```

- Secret lives only in **Supabase Edge Function secrets**.
- Minimum length enforced by the function: 32 characters.
- Never commit the secret. Never log it.

Also required in Edge secrets:

- `JULES_API_KEY` (Jules API)
- Platform: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

## API

Base URL:

`https://ahkwooaqayqikvotwuac.supabase.co/functions/v1/jules-orchestrator`

### POST `/create`

```json
{
  "title": "Autonomous orchestration smoke test",
  "prompt": "Add a single HTML comment to README.md saying Autonomous orchestration smoke test. Do not change any other file.",
  "idempotency_key": "unique-key-per-logical-task"
}
```

Response:

```json
{
  "ok": true,
  "request_id": "uuid",
  "jules_session_id": "...",
  "status": "created"
}
```

Duplicate `idempotency_key` returns the same `request_id` / session (`deduplicated: true`) and does **not** create a second Jules session.

Failed rows are **not** automatically retried under the same key (use a new `idempotency_key`).

Rate limit: **20 creates per rolling hour** (HTTP 429 when exceeded).

### GET `/status/:request_id`

Returns stored row + optional live Jules session state/outputs.
Requires the shared secret (same as create). Knowledge of a UUID alone is insufficient without the secret.

### POST `/message/:request_id`

```json
{ "prompt": "follow-up instructions" }
```

## Deploy (operator)

```bash
# Link project once
supabase link --project-ref ahkwooaqayqikvotwuac

# Apply migration 000010
supabase db push

# Secrets (values never committed)
supabase secrets set JULES_API_KEY="..."
supabase secrets set ORCHESTRATOR_SHARED_SECRET="$(openssl rand -hex 32)"

# Deploy function (verify_jwt=false for this function only; auth is shared secret)
supabase functions deploy jules-orchestrator
```

## Security properties

- No public unauthenticated create/status/message
- No arbitrary repo/branch
- No generic Jules API proxy
- No secret leakage in JSON errors
- RLS enabled + client grants revoked on `jules_orchestration_requests`
- Create rate limit (20/hour)
- Existing GitHub Jules `/jules` workflow and auto-merge high-risk gates unchanged
- Next.js `tsconfig` excludes `supabase/functions` (Deno) so CI typecheck is unaffected

## Tests

```bash
deno test supabase/functions/jules-orchestrator/orchestrator_logic_test.ts
```

## ChatGPT limitation

ChatGPT must be able to call arbitrary HTTPS endpoints with a custom `Authorization` header and hold `ORCHESTRATOR_SHARED_SECRET` in a private tool/connector configuration. This environment does **not** make the endpoint public to avoid that requirement.
