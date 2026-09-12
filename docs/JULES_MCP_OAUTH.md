# Jules MCP OAuth Gateway (security-hardened)

OAuth 2.1 authorization-code + **PKCE S256** gateway for Claude/Grok connectors that cannot send static Bearer headers.

Proxies Streamable HTTP MCP to **unchanged** `jules-mcp` using server-side `MCP_SHARED_SECRET`.

## Security controls

| Control | Behavior |
|---------|----------|
| PKCE | **S256 only** (RFC 7636) |
| state | **Required** on `/authorize` |
| redirect_uri | Exact match allowlist + per-client registration |
| auth codes | Hashed, **single-use**, 10m TTL, bound to client_id + redirect_uri + challenge |
| access token | HMAC JWT, `iss`/`aud`/`resource` = gateway URL, 1h TTL |
| refresh | **Rotate**: revoke old hash, issue new |
| DCR (RFC 7591) | Requires `OAUTH_DCR_TOKEN`; allowlisted redirects; rate limited |
| WWW-Authenticate | Bearer + `resource_metadata` |
| CORS | No `Access-Control-Allow-Origin: *` |
| Upstream | Path must end `/jules-mcp`; same origin unless explicit env |
| Secrets | Never in responses; `MCP_SHARED_SECRET` only on upstream request |

## Secrets

| Name | Purpose |
|------|---------|
| `OAUTH_TOKEN_HMAC_SECRET` | Access token MAC |
| `OAUTH_OPERATOR_APPROVAL_SECRET` | Human approve on `/authorize` |
| `OAUTH_REDIRECT_URI_ALLOWLIST` | Exact redirect URIs |
| `OAUTH_DCR_TOKEN` | Bearer for `POST /register` |
| `MCP_SHARED_SECRET` | Upstream `jules-mcp` only |
| `JULES_MCP_UPSTREAM_URL` | Optional absolute `…/jules-mcp` |
| `OAUTH_ISSUER_URL` | Optional issuer override |

## Connector URL

`https://ahkwooaqayqikvotwuac.supabase.co/functions/v1/jules-mcp-oauth`

Metadata:

- `/.well-known/oauth-authorization-server`
- `/.well-known/oauth-protected-resource`

MCP path: `/` or `/mcp` with `Authorization: Bearer <access_token>`.

## Fixed product scope

Upstream `jules-mcp` enforces repo `nw7thhjzkk-crypto/drdhlefc` and branch `scaffold-gymsmart-erp-9743545895368865022`. Gateway does not add merge tools.
