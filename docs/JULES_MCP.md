# Jules MCP Server (Phase 1)

Remote **Model Context Protocol** server for Grok / xAI custom MCP connectors.
Orchestrates Jules on `nw7thhjzkk-crypto/drdhlefc` without exposing `JULES_API_KEY`.

## Architecture

```
Grok (Custom MCP connector)
  → HTTPS Streamable HTTP (JSON-RPC 2.0 POST)
  → Authorization: Bearer MCP_SHARED_SECRET
  → Supabase Edge Function jules-mcp
  → Jules REST API (x-goog-api-key from server secret)
  → Jules PR → existing CI → guarded auto-merge
```

Reuses table `jules_orchestration_requests` (migration `000010`) for idempotency
and audit-style status records. Does **not** replace `jules-orchestrator` or
GitHub `/jules` automation.

## Endpoint

`https://ahkwooaqayqikvotwuac.supabase.co/functions/v1/jules-mcp`

Transport: **Streamable HTTP** (POST JSON-RPC). GET/SSE is not offered.

## Authentication

Compatible with xAI Remote MCP `authorization` and Grok custom connectors that
send a static Bearer credential:

```http
Authorization: Bearer <MCP_SHARED_SECRET>
```

- Secret only in Supabase Edge Function secrets (min 32 characters).
- Constant-time comparison.
- Fail closed if `MCP_SHARED_SECRET` or `JULES_API_KEY` is missing.
- No secrets in URL/query string.

## Required secrets (names only)

| Name | Purpose |
|------|---------|
| `MCP_SHARED_SECRET` | Bearer token for MCP clients (Grok) |
| `JULES_API_KEY` | Jules API (`x-goog-api-key`) |
| `SUPABASE_URL` | Platform-injected |
| `SUPABASE_SERVICE_ROLE_KEY` | Platform-injected; orchestration table access |

## Exposed tools

| Tool | Purpose |
|------|---------|
| `start_jules_task` | Create Jules session (`AUTO_CREATE_PR`) |
| `get_jules_task` | Session status/metadata |
| `get_jules_activities` | Activity/progress list |
| `message_jules_task` | Follow-up message |

Fixed Jules source: `sources/github/nw7thhjzkk-crypto/drdhlefc`  
Fixed branch: `scaffold-gymsmart-erp-9743545895368865022`

## Grok connector setup

1. Deploy function: `supabase functions deploy jules-mcp`
2. Set `MCP_SHARED_SECRET` and ensure `JULES_API_KEY` exists.
3. Apply migration `000010` if not already applied.
4. In Grok: **Connectors → New → Custom**
5. Server URL: the function URL above
6. Provide Bearer / authorization using `MCP_SHARED_SECRET` (never commit it)

For xAI API Remote MCP tools, use `server_url` + `authorization` (Bearer token).

## Security model

- No arbitrary repo/branch/source
- No arbitrary HTTP proxy or shell
- Session ID path validation
- Input length limits
- Create rate limit: 20/hour; message rate limit: 60/hour
- Idempotency via `mcp:<idempotency_key>` on orchestration table
- Secret redaction in logs/errors
- No wildcard CORS
- `verify_jwt = false` only for this function; auth is MCP shared secret

## What this server does NOT permit

- Choosing another GitHub repository or branch
- Calling arbitrary Jules or third-party URLs
- Executing shell/commands
- Returning `JULES_API_KEY` or other secrets
- Unauthenticated access
- Merging PRs (Jules + existing CI/auto-merge only)

## Local tests

```bash
deno test supabase/functions/jules-mcp/mcp_logic_test.ts
```

Manual MCP smoke (after deploy):

```bash
curl -sS -X POST "$URL" \
  -H "Authorization: Bearer $MCP_SHARED_SECRET" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"curl","version":"1.0"}}}'
```
