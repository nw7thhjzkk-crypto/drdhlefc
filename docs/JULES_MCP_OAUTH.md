# Jules MCP OAuth Gateway (Claude / Grok connectors)

Separate **OAuth 2.1 authorization-code + PKCE** gateway for clients that cannot send a static `Authorization` header (Claude Custom Connector, Grok Custom Connector OAuth UI).

## Architecture

```
Claude / Grok connector
  → OAuth 2.1 + PKCE (this function: jules-mcp-oauth)
  → access_token (HMAC JWT)
  → Streamable HTTP MCP on jules-mcp-oauth
  → server-side forward to jules-mcp
       Authorization: Bearer MCP_SHARED_SECRET
  → existing Jules tools / rate limits / fixed repo-branch
```

**`jules-mcp` is unchanged** and remains static-Bearer only.

## Fixed scope

- Repository: `nw7thhjzkk-crypto/drdhlefc`
- Branch: `scaffold-gymsmart-erp-9743545895368865022`
- Tools: whatever `jules-mcp` exposes (start/get/activities/message)
- No merge tool; no arbitrary upstream URLs

## Endpoints

Base: `https://ahkwooaqayqikvotwuac.supabase.co/functions/v1/jules-mcp-oauth`

| Path | Purpose |
|------|---------|
| `/.well-known/oauth-authorization-server` | AS metadata |
| `/.well-known/oauth-protected-resource` | Resource metadata |
| `/register` | Dynamic client registration (allowlisted redirects only) |
| `/authorize` | Authorization + operator approval |
| `/token` | Code exchange + refresh |
| `/` or `/mcp` | MCP Streamable HTTP proxy |
| `/health` | Liveness |

## Secrets (names only)

| Secret | Purpose |
|--------|---------|
| `OAUTH_TOKEN_HMAC_SECRET` | Sign/verify access tokens (≥32 chars) |
| `OAUTH_OPERATOR_APPROVAL_SECRET` | Human consent on authorize page (≥16) |
| `OAUTH_REDIRECT_URI_ALLOWLIST` | Comma-separated exact redirect URIs |
| `MCP_SHARED_SECRET` | Upstream `jules-mcp` only |
| `JULES_MCP_UPSTREAM_URL` | Optional; default `…/functions/v1/jules-mcp` |
| `OAUTH_ISSUER_URL` | Optional explicit issuer |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Platform |

Never put secrets in Git, docs examples, or client-visible responses.

## Database

Migration `000011_jules_mcp_oauth.sql`: clients, one-time codes, refresh tokens. RLS on; service_role only.

## Deploy (operator)

```bash
supabase db push   # applies 000011
supabase secrets set OAUTH_TOKEN_HMAC_SECRET="..." \
  OAUTH_OPERATOR_APPROVAL_SECRET="..." \
  OAUTH_REDIRECT_URI_ALLOWLIST="https://grok.com/connectors-oauth-exchange-code/,https://claude.ai/api/mcp/auth_callback" \
  MCP_SHARED_SECRET="..."  # same as jules-mcp
supabase functions deploy jules-mcp-oauth --no-verify-jwt
```

Ensure `jules-mcp` is already deployed.

## Grok connector

1. Connectors → New → Custom  
2. Name: `DR DHL EFC Jules`  
3. Server URL: `https://ahkwooaqayqikvotwuac.supabase.co/functions/v1/jules-mcp-oauth`  
4. Complete **OAuth** when prompted (not static Bearer)  
5. Approve in browser with `OAUTH_OPERATOR_APPROVAL_SECRET`  

Add Grok’s exact redirect URI to `OAUTH_REDIRECT_URI_ALLOWLIST` if it differs.

## Claude connector

1. Custom connector / MCP URL: same OAuth gateway URL  
2. Use OAuth; register redirect `https://claude.ai/api/mcp/auth_callback` (or Claude’s current callback) in allowlist  
3. Approve with operator secret  

## Security properties

- PKCE S256 required  
- Redirect allowlist + per-client registered URIs  
- Auth codes single-use, short TTL  
- Access tokens expire (1h); refresh rotation table  
- Upstream fixed to `*/jules-mcp`  
- `MCP_SHARED_SECRET` / `JULES_API_KEY` never sent to OAuth clients  

## Tests

```bash
deno test supabase/functions/jules-mcp-oauth/oauth_logic_test.ts
```
