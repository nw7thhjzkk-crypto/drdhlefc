/**
 * Jules MCP OAuth 2.1 + PKCE gateway (security-hardened)
 *
 * Connector → authorization-code + PKCE S256 → access_token (aud=resource)
 *   → Streamable HTTP MCP on this function
 *   → server-side proxy to jules-mcp with MCP_SHARED_SECRET
 *
 * jules-mcp auth is NOT modified. Secrets never returned to clients.
 *
 * Env:
 *   OAUTH_TOKEN_HMAC_SECRET (>=32)
 *   OAUTH_OPERATOR_APPROVAL_SECRET (>=16)
 *   OAUTH_REDIRECT_URI_ALLOWLIST (exact URIs, comma-separated)
 *   OAUTH_DCR_TOKEN (>=32) — required Bearer for POST /register
 *   MCP_SHARED_SECRET (>=32) — upstream only
 *   JULES_MCP_UPSTREAM_URL — optional absolute URL ending in /jules-mcp
 *   OAUTH_ISSUER_URL — optional explicit issuer/resource base
 *   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { Hono } from "npm:hono@^4.9.7";

const FIXED_REPO = "nw7thhjzkk-crypto/drdhlefc";
const FIXED_BRANCH = "scaffold-gymsmart-erp-9743545895368865022";
const ACCESS_TTL_SEC = 3600;
const CODE_TTL_SEC = 600;
const REFRESH_TTL_SEC = 60 * 60 * 24 * 30;
const MAX_DCR_PER_HOUR = 10;
const MAX_TOKEN_PER_HOUR = 120;

function b64url(data: ArrayBuffer | Uint8Array | string): string {
  const bytes =
    typeof data === "string"
      ? new TextEncoder().encode(data)
      : data instanceof Uint8Array
      ? data
      : new Uint8Array(data);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aa = enc.encode(a);
  const bb = enc.encode(b);
  if (aa.length !== bb.length) {
    let d = 0;
    const n = Math.max(aa.length, bb.length);
    for (let i = 0; i < n; i++) d |= (aa[i] ?? 0) ^ (bb[i] ?? 0);
    return false;
  }
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}

async function sha256(input: string): Promise<string> {
  const dig = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return b64url(dig);
}

async function hmacSign(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(msg),
  );
  return b64url(sig);
}

async function hmacVerify(
  secret: string,
  msg: string,
  sig: string,
): Promise<boolean> {
  const expected = await hmacSign(secret, msg);
  return timingSafeEqual(expected, sig);
}

function requireEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error("missing_env");
  return v;
}

function publicBase(req: Request): string {
  const explicit = Deno.env.get("OAUTH_ISSUER_URL");
  if (explicit) return explicit.replace(/\/$/, "");
  const u = new URL(req.url);
  const path = u.pathname.replace(/\/+$/, "");
  const idx = path.lastIndexOf("/jules-mcp-oauth");
  const basePath =
    idx >= 0 ? path.slice(0, idx + "/jules-mcp-oauth".length) : path;
  return `${u.origin}${basePath}`;
}

function allowlist(): string[] {
  return (Deno.env.get("OAUTH_REDIRECT_URI_ALLOWLIST") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Exact match only (RFC 6749 redirect_uri). */
function redirectAllowed(uri: string): boolean {
  const list = allowlist();
  if (list.length === 0) return false;
  return list.some((a) => a === uri);
}

function supabaseAdmin() {
  return createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function issueAccessToken(
  clientId: string,
  scope: string,
  resource: string,
): Promise<string> {
  const secret = requireEnv("OAUTH_TOKEN_HMAC_SECRET");
  if (secret.length < 32) throw new Error("weak_token_secret");
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(
    JSON.stringify({
      iss: resource,
      sub: clientId,
      aud: resource,
      resource,
      scope,
      iat: now,
      exp: now + ACCESS_TTL_SEC,
      jti: crypto.randomUUID(),
    }),
  );
  const sig = await hmacSign(secret, `${header}.${payload}`);
  return `${header}.${payload}.${sig}`;
}

async function verifyAccessToken(
  token: string,
  expectedResource: string,
): Promise<{ clientId: string; scope: string } | null> {
  const secret = Deno.env.get("OAUTH_TOKEN_HMAC_SECRET");
  if (!secret || secret.length < 32) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  if (!(await hmacVerify(secret, `${header}.${payload}`, sig))) return null;
  try {
    const body = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as {
      exp?: number;
      sub?: string;
      scope?: string;
      iss?: string;
      aud?: string;
      resource?: string;
    };
    if (!body.exp || body.exp < Math.floor(Date.now() / 1000)) return null;
    if (!body.sub) return null;
    // RFC 8707: token must be bound to this resource
    if (body.aud !== expectedResource && body.resource !== expectedResource) {
      return null;
    }
    if (body.iss !== expectedResource) return null;
    return { clientId: body.sub, scope: body.scope ?? "mcp" };
  } catch {
    return null;
  }
}

function oauthError(
  error: string,
  description: string,
  status = 400,
): Response {
  return new Response(
    JSON.stringify({ error, error_description: description }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Pragma": "no-cache",
      },
    },
  );
}

function unauthorizedMcp(resource: string): Response {
  const meta = `${resource}/.well-known/oauth-protected-resource`;
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "WWW-Authenticate":
        `Bearer realm="jules-mcp-oauth", resource="${resource}", ` +
        `resource_metadata="${meta}", error="invalid_token"`,
    },
  });
}

async function rateLimitClients(
  sb: ReturnType<typeof supabaseAdmin>,
  max: number,
): Promise<boolean> {
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count, error } = await sb
    .from("jules_mcp_oauth_clients")
    .select("client_id", { count: "exact", head: true })
    .gte("created_at", since);
  if (error) return true; // fail closed
  return (count ?? 0) >= max;
}

async function rateLimitCodes(
  sb: ReturnType<typeof supabaseAdmin>,
  max: number,
): Promise<boolean> {
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count, error } = await sb
    .from("jules_mcp_oauth_codes")
    .select("code_hash", { count: "exact", head: true })
    .gte("created_at", since);
  if (error) return true;
  return (count ?? 0) >= max;
}

function resolveUpstream(req: Request): URL | null {
  const explicit = Deno.env.get("JULES_MCP_UPSTREAM_URL");
  const fallback =
    `${new URL(req.url).origin}/functions/v1/jules-mcp`;
  const raw = explicit || fallback;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.hostname !== "localhost") return null;
    if (!u.pathname.replace(/\/$/, "").endsWith("/jules-mcp")) return null;
    // Same host as this function unless explicitly overridden via env
    if (!explicit && u.origin !== new URL(req.url).origin) return null;
    return u;
  } catch {
    return null;
  }
}

const app = new Hono();

// No wildcard CORS — browser connectors use redirects, not credentialed XHR to AS.
app.use("*", async (c, next) => {
  await next();
  c.res.headers.set("X-Content-Type-Options", "nosniff");
  c.res.headers.set("Cache-Control", c.res.headers.get("Cache-Control") ?? "no-store");
  c.res.headers.delete("Access-Control-Allow-Origin");
});

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "jules-mcp-oauth",
    repository: FIXED_REPO,
    production_branch: FIXED_BRANCH,
    upstream: "jules-mcp (server-side Bearer only)",
  }),
);

/** RFC 8414 Authorization Server Metadata */
app.get("/.well-known/oauth-authorization-server", (c) => {
  const issuer = publicBase(c.req.raw);
  return c.json({
    issuer,
    authorization_endpoint: `${issuer}/authorize`,
    token_endpoint: `${issuer}/token`,
    registration_endpoint: `${issuer}/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: ["mcp"],
    resource_indicators_supported: true,
  });
});

/** RFC 8707 / MCP Protected Resource Metadata */
app.get("/.well-known/oauth-protected-resource", (c) => {
  const resource = publicBase(c.req.raw);
  return c.json({
    resource,
    authorization_servers: [resource],
    scopes_supported: ["mcp"],
    bearer_methods_supported: ["header"],
  });
});

/** RFC 7591 DCR — requires OAUTH_DCR_TOKEN; allowlisted redirects only */
app.post("/register", async (c) => {
  const dcr = Deno.env.get("OAUTH_DCR_TOKEN") ?? "";
  if (dcr.length < 32) {
    return oauthError("temporarily_unavailable", "DCR not configured", 503);
  }
  const auth = c.req.header("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m || !timingSafeEqual(m[1].trim(), dcr)) {
    return oauthError("invalid_client", "DCR token required", 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return oauthError("invalid_client_metadata", "invalid JSON");
  }
  const redirectUris = Array.isArray(body.redirect_uris)
    ? body.redirect_uris.map(String)
    : [];
  if (redirectUris.length === 0 || redirectUris.length > 5) {
    return oauthError("invalid_redirect_uri", "redirect_uris required (max 5)");
  }
  for (const u of redirectUris) {
    if (!redirectAllowed(u)) {
      return oauthError("invalid_redirect_uri", "redirect_uri not allowlisted");
    }
  }

  const sb = supabaseAdmin();
  if (await rateLimitClients(sb, MAX_DCR_PER_HOUR)) {
    return oauthError("temporarily_unavailable", "registration rate limit", 429);
  }

  const clientId = crypto.randomUUID();
  const name =
    typeof body.client_name === "string" && body.client_name.trim()
      ? body.client_name.trim().slice(0, 128)
      : "mcp-connector";
  const { error } = await sb.from("jules_mcp_oauth_clients").insert({
    client_id: clientId,
    client_secret_hash: null,
    client_name: name,
    redirect_uris: redirectUris,
    token_endpoint_auth_method: "none",
  });
  if (error) return oauthError("server_error", "registration failed", 500);
  return c.json(
    {
      client_id: clientId,
      client_name: name,
      redirect_uris: redirectUris,
      grant_types: ["authorization_code", "refresh_token"],
      token_endpoint_auth_method: "none",
      code_challenge_methods: ["S256"],
    },
    201,
  );
});

app.get("/authorize", async (c) => {
  const q = c.req.query();
  const clientId = q.client_id ?? "";
  const redirectUri = q.redirect_uri ?? "";
  const responseType = q.response_type ?? "";
  const state = q.state ?? "";
  const challenge = q.code_challenge ?? "";
  const method = q.code_challenge_method ?? "";
  const scope = (q.scope ?? "mcp").split(" ")[0];
  const resource = q.resource ?? publicBase(c.req.raw);

  if (responseType !== "code") {
    return oauthError("unsupported_response_type", "only code");
  }
  if (!state || state.length > 512) {
    return oauthError("invalid_request", "state required");
  }
  if (method !== "S256" || !challenge || challenge.length < 43) {
    return oauthError("invalid_request", "PKCE S256 required");
  }
  if (scope !== "mcp") {
    return oauthError("invalid_scope", "only mcp scope supported");
  }
  if (!redirectAllowed(redirectUri)) {
    return oauthError("invalid_request", "redirect_uri not allowlisted");
  }
  if (resource !== publicBase(c.req.raw)) {
    return oauthError("invalid_target", "resource must be this gateway");
  }

  const sb = supabaseAdmin();
  const { data: client } = await sb
    .from("jules_mcp_oauth_clients")
    .select("client_id, redirect_uris")
    .eq("client_id", clientId)
    .maybeSingle();
  if (!client) return oauthError("invalid_client", "unknown client", 401);
  if (!(client.redirect_uris as string[]).includes(redirectUri)) {
    return oauthError("invalid_request", "redirect_uri not registered");
  }

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Authorize Jules MCP</title>
<style>body{font-family:system-ui;max-width:480px;margin:2rem auto;padding:0 1rem}
button{padding:.6rem 1rem;margin-right:.5rem}input{width:100%;padding:.5rem;margin:.5rem 0}</style></head>
<body>
<h1>Authorize DR DHL Jules MCP</h1>
<p>Client: <code>${escapeHtml(clientId)}</code></p>
<p>Repository: <code>${FIXED_REPO}</code><br/>Branch: <code>${FIXED_BRANCH}</code></p>
<p>Grants MCP tools only (no merge, no arbitrary repos).</p>
<form method="POST" action="">
<input type="hidden" name="client_id" value="${escapeHtml(clientId)}"/>
<input type="hidden" name="redirect_uri" value="${escapeHtml(redirectUri)}"/>
<input type="hidden" name="state" value="${escapeHtml(state)}"/>
<input type="hidden" name="code_challenge" value="${escapeHtml(challenge)}"/>
<input type="hidden" name="code_challenge_method" value="S256"/>
<input type="hidden" name="scope" value="mcp"/>
<input type="hidden" name="resource" value="${escapeHtml(resource)}"/>
<label>Operator approval secret</label>
<input type="password" name="approval_secret" required autocomplete="current-password"/>
<div><button type="submit" name="decision" value="approve">Approve</button>
<button type="submit" name="decision" value="deny">Deny</button></div>
</form></body></html>`;
  return c.html(html);
});

app.post("/authorize", async (c) => {
  const form = await c.req.parseBody();
  const decision = String(form.decision ?? "");
  const clientId = String(form.client_id ?? "");
  const redirectUri = String(form.redirect_uri ?? "");
  const state = String(form.state ?? "");
  const challenge = String(form.code_challenge ?? "");
  const method = String(form.code_challenge_method ?? "");
  const scope = String(form.scope ?? "mcp");
  const resource = String(form.resource ?? publicBase(c.req.raw));
  const approval = String(form.approval_secret ?? "");

  if (!redirectAllowed(redirectUri)) {
    return oauthError("invalid_request", "redirect_uri not allowlisted");
  }
  if (!state) return oauthError("invalid_request", "state required");

  if (decision !== "approve") {
    const deny = new URL(redirectUri);
    deny.searchParams.set("error", "access_denied");
    deny.searchParams.set("state", state);
    return c.redirect(deny.toString(), 302);
  }

  const expected = Deno.env.get("OAUTH_OPERATOR_APPROVAL_SECRET") ?? "";
  if (expected.length < 16 || !timingSafeEqual(approval, expected)) {
    return oauthError("access_denied", "invalid operator approval", 403);
  }
  if (method !== "S256" || challenge.length < 43) {
    return oauthError("invalid_request", "PKCE S256 required");
  }
  if (scope !== "mcp") return oauthError("invalid_scope", "only mcp");
  if (resource !== publicBase(c.req.raw)) {
    return oauthError("invalid_target", "resource mismatch");
  }

  const sb = supabaseAdmin();
  if (await rateLimitCodes(sb, MAX_TOKEN_PER_HOUR)) {
    return oauthError("temporarily_unavailable", "authorize rate limit", 429);
  }

  const { data: client } = await sb
    .from("jules_mcp_oauth_clients")
    .select("client_id, redirect_uris")
    .eq("client_id", clientId)
    .maybeSingle();
  if (!client || !(client.redirect_uris as string[]).includes(redirectUri)) {
    return oauthError("invalid_client", "client/redirect mismatch", 401);
  }

  const code = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const codeHash = await sha256(code);
  const expires = new Date(Date.now() + CODE_TTL_SEC * 1000).toISOString();
  // Bind client_id + redirect_uri + code_challenge in stored row
  const { error } = await sb.from("jules_mcp_oauth_codes").insert({
    code_hash: codeHash,
    client_id: clientId,
    redirect_uri: redirectUri,
    code_challenge: challenge,
    code_challenge_method: "S256",
    scope: `mcp|${resource}`,
    expires_at: expires,
  });
  if (error) return oauthError("server_error", "code issue failed", 500);

  const ok = new URL(redirectUri);
  ok.searchParams.set("code", code);
  ok.searchParams.set("state", state);
  return c.redirect(ok.toString(), 302);
});

app.post("/token", async (c) => {
  let params: URLSearchParams;
  const ct = c.req.header("content-type") ?? "";
  if (ct.includes("application/json")) {
    const j = await c.req.json();
    params = new URLSearchParams();
    for (const [k, v] of Object.entries(j as Record<string, string>)) {
      params.set(k, String(v));
    }
  } else {
    params = new URLSearchParams(await c.req.text());
  }

  const grant = params.get("grant_type") ?? "";
  const sb = supabaseAdmin();
  const resourceBase = publicBase(c.req.raw);

  if (grant === "authorization_code") {
    const code = params.get("code") ?? "";
    const redirectUri = params.get("redirect_uri") ?? "";
    const clientId = params.get("client_id") ?? "";
    const verifier = params.get("code_verifier") ?? "";
    if (!code || !redirectUri || !clientId || !verifier) {
      return oauthError("invalid_request", "missing token params");
    }
    if (verifier.length < 43 || verifier.length > 128) {
      return oauthError("invalid_grant", "invalid code_verifier");
    }

    const codeHash = await sha256(code);
    const { data: row } = await sb
      .from("jules_mcp_oauth_codes")
      .select("*")
      .eq("code_hash", codeHash)
      .maybeSingle();
    if (!row) return oauthError("invalid_grant", "unknown code");
    if (row.used_at) return oauthError("invalid_grant", "code already used");
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return oauthError("invalid_grant", "code expired");
    }
    if (row.client_id !== clientId || row.redirect_uri !== redirectUri) {
      return oauthError("invalid_grant", "code mismatch");
    }

    const expectedChallenge = await sha256(verifier);
    if (!timingSafeEqual(expectedChallenge, row.code_challenge)) {
      return oauthError("invalid_grant", "PKCE verification failed");
    }

    // Single-use: mark used before issuing tokens
    const { data: updated, error: useErr } = await sb
      .from("jules_mcp_oauth_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("code_hash", codeHash)
      .is("used_at", null)
      .select("code_hash")
      .maybeSingle();
    if (useErr || !updated) {
      return oauthError("invalid_grant", "code already used");
    }

    const scopePart = String(row.scope).split("|")[0] || "mcp";
    const resPart = String(row.scope).split("|")[1] || resourceBase;
    if (resPart !== resourceBase) {
      return oauthError("invalid_grant", "resource mismatch");
    }

    const access = await issueAccessToken(clientId, scopePart, resourceBase);
    const refresh = b64url(crypto.getRandomValues(new Uint8Array(32)));
    const refreshHash = await sha256(refresh);
    await sb.from("jules_mcp_oauth_refresh_tokens").insert({
      token_hash: refreshHash,
      client_id: clientId,
      scope: `${scopePart}|${resourceBase}`,
      expires_at: new Date(Date.now() + REFRESH_TTL_SEC * 1000).toISOString(),
    });

    return c.json({
      access_token: access,
      token_type: "Bearer",
      expires_in: ACCESS_TTL_SEC,
      refresh_token: refresh,
      scope: scopePart,
    });
  }

  if (grant === "refresh_token") {
    const refresh = params.get("refresh_token") ?? "";
    const clientId = params.get("client_id") ?? "";
    if (!refresh || !clientId) {
      return oauthError("invalid_request", "missing refresh params");
    }
    const refreshHash = await sha256(refresh);
    const { data: row } = await sb
      .from("jules_mcp_oauth_refresh_tokens")
      .select("*")
      .eq("token_hash", refreshHash)
      .maybeSingle();
    if (!row || row.revoked_at) {
      return oauthError("invalid_grant", "invalid refresh token");
    }
    if (row.client_id !== clientId) {
      return oauthError("invalid_grant", "client mismatch");
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return oauthError("invalid_grant", "refresh expired");
    }

    // Rotation: revoke presented refresh before issuing new pair
    const { data: revoked } = await sb
      .from("jules_mcp_oauth_refresh_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("token_hash", refreshHash)
      .is("revoked_at", null)
      .select("token_hash")
      .maybeSingle();
    if (!revoked) return oauthError("invalid_grant", "refresh replay");

    const scopePart = String(row.scope).split("|")[0] || "mcp";
    const access = await issueAccessToken(clientId, scopePart, resourceBase);
    const newRefresh = b64url(crypto.getRandomValues(new Uint8Array(32)));
    const newHash = await sha256(newRefresh);
    await sb.from("jules_mcp_oauth_refresh_tokens").insert({
      token_hash: newHash,
      client_id: clientId,
      scope: `${scopePart}|${resourceBase}`,
      expires_at: new Date(Date.now() + REFRESH_TTL_SEC * 1000).toISOString(),
    });

    return c.json({
      access_token: access,
      token_type: "Bearer",
      expires_in: ACCESS_TTL_SEC,
      refresh_token: newRefresh,
      scope: scopePart,
    });
  }

  return oauthError("unsupported_grant_type", "unsupported grant");
});

async function proxyMcp(c: {
  req: { raw: Request; header: (n: string) => string | undefined };
}): Promise<Response> {
  const resource = publicBase(c.req.raw);
  const auth = c.req.header("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return unauthorizedMcp(resource);

  const verified = await verifyAccessToken(m[1].trim(), resource);
  if (!verified) return unauthorizedMcp(resource);

  const upstreamUrl = resolveUpstream(c.req.raw);
  if (!upstreamUrl) {
    return new Response(JSON.stringify({ error: "misconfigured_upstream" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const shared = Deno.env.get("MCP_SHARED_SECRET");
  if (!shared || shared.length < 32) {
    return new Response(JSON.stringify({ error: "server misconfigured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const headers = new Headers();
  const ct = c.req.header("content-type");
  const accept = c.req.header("accept");
  if (ct) headers.set("Content-Type", ct);
  if (accept) headers.set("Accept", accept);
  // Server-side only — never echo shared secret back to client
  headers.set("Authorization", `Bearer ${shared}`);

  const init: RequestInit = {
    method: c.req.raw.method,
    headers,
    redirect: "manual",
  };
  if (c.req.raw.method !== "GET" && c.req.raw.method !== "HEAD") {
    init.body = await c.req.raw.arrayBuffer();
  }

  const res = await fetch(upstreamUrl.toString(), init);
  const outHeaders = new Headers();
  for (const h of ["content-type", "cache-control", "mcp-session-id"]) {
    const v = res.headers.get(h);
    if (v) outHeaders.set(h, v);
  }
  // Ensure secrets never appear in downstream body echo (pass-through binary)
  return new Response(res.body, { status: res.status, headers: outHeaders });
}

app.all("/mcp", (c) => proxyMcp(c));
app.all("/", async (c) => {
  if (c.req.method === "GET" && !c.req.header("authorization")) {
    return c.json({
      service: "jules-mcp-oauth",
      mcp: "/mcp",
      authorization_server_metadata:
        "/.well-known/oauth-authorization-server",
      protected_resource_metadata: "/.well-known/oauth-protected-resource",
    });
  }
  return proxyMcp(c);
});

Deno.serve(app.fetch);
