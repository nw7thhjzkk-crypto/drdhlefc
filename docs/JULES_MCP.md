# Jules MCP Server (Phase 1)

Remote **Model Context Protocol** server for Grok / xAI custom MCP connectors.
Orchestrates Jules on `nw7thhjzkk-crypto/drdhlefc` without exposing `JULES_API_KEY`.

## Selected MCP implementation

| Choice | Detail |
|--------|--------|
| Library | **`@modelcontextprotocol/sdk@1.25.3`** (official TypeScript SDK) |
| Transport | **`WebStandardStreamableHTTPServerTransport`** |
| Router | **Hono** (`npm:hono@^4.9.7`) |
| Schemas | **Zod** |
| Why | Documented by **Supabase BYO MCP** for Edge Functions + Deno; web-standard `Request`/`Response` (no Node `http`); Streamable HTTP compatible with Grok/xAI Remote MCP |

Alternative considered: `mcp-lite` (also Edge-compatible). Official SDK chosen to match Supabase’s primary documented path.

## Architecture

```
Grok (Custom MCP / xAI Remote MCP)
  → HTTPS Streamable HTTP
  → Authorization: Bearer MCP_SHARED_SECRET
  → Supabase Edge Function jules-mcp
       Hono → auth gate → McpServer + WebStandardStreamableHTTPServerTransport
  → Jules REST API (server-side JULES_API_KEY)
  → Jules PR → CI → guarded auto-merge
```

Reuses `jules_orchestration_requests` (migration `000010`) for idempotency and status audit rows.
Does **not** replace `jules-orchestrator` or GitHub `/jules` automation.

## Endpoint

`https://ahkwooaqayqikvotwuac.supabase.co/functions/v1/jules-mcp`

Health (authenticated): `GET .../jules-mcp/health`

## Authentication

```http
Authorization: Bearer <MCP_SHARED_SECRET>
```

Compatible with xAI Remote MCP `authorization` and Grok connectors that attach a static Bearer credential. Timing-safe compare; fail closed if secrets missing.

## Required secrets (names only)

| Name | Purpose |
|------|---------|
| `MCP_SHARED_SECRET` | Bearer for MCP clients |
| `JULES_API_KEY` | Jules API |
| `SUPABASE_URL` | Platform |
| `SUPABASE_SERVICE_ROLE_KEY` | Orchestration table |

## Tools

| Tool | Purpose |
|------|---------|
| `start_jules_task` | Create session (`AUTO_CREATE_PR`) |
| `get_jules_task` | Session status |
| `get_jules_activities` | Activity list |
| `message_jules_task` | Follow-up message |

Fixed source: `sources/github/nw7thhjzkk-crypto/drdhlefc`
Fixed branch: `scaffold-gymsmart-erp-9743545895368865022`

## Grok setup

1. Deploy: `supabase functions deploy jules-mcp` (with `verify_jwt = false` in config)
2. Set `MCP_SHARED_SECRET`; ensure `JULES_API_KEY` and migration `000010`
3. Grok → Connectors → Custom → server URL above + Bearer secret

## Security

- No arbitrary repo/branch/URL/proxy
- Session ID validation
- Rate limits (20 creates/hour, 60 messages/hour)
- Idempotency keys `mcp:<key>`
- Secret redaction
- No wildcard CORS

## Tests

```bash
deno test supabase/functions/jules-mcp/mcp_logic_test.ts
```

Live MCP smoke after deploy (client-style):

```bash
curl -sS -X POST "$URL" \
  -H "Authorization: Bearer $MCP_SHARED_SECRET" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"curl","version":"1.0"}}}'
```

## Not permitted

Other repos/branches, arbitrary Jules/HTTP proxy, shell, secret leakage, unauthenticated access, PR merge via MCP.
