/**
 * Jules MCP OAuth 2.1 + PKCE gateway
 *
 * Claude/Grok Custom Connectors complete authorization-code + PKCE here,
 * then call Streamable HTTP MCP on this function. The gateway validates the
 * OAuth access token and server-side forwards to jules-mcp using
 * MCP_SHARED_SECRET (never returned to clients).
 *
 * Does NOT implement Jules tools itself. Does NOT weaken jules-mcp auth.
 *
 * Secrets (env):
 *   OAUTH_TOKEN_HMAC_SECRET (>=32)
 *   OAUTH_OPERATOR_APPROVAL_SECRET (>=16) — human consent on /authorize
 *   OAUTH_REDIRECT_URI_ALLOWLIST — comma-separated exact redirect URIs
 *   MCP_SHARED_SECRET — for upstream jules-mcp only
 *   JULES_MCP_UPSTREAM_URL — default project functions URL for jules-mcp
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
  // Supabase functions path prefix
  const path = u.pathname.replace(/\/+$/, "");
  const idx = path.lastIndexOf("/jules-mcp-oauth");
  const basePath = idx >= 0 ? path.slice(0, idx + "/jules-mcp-oauth".length) : path;
  return `${u.origin}${basePath}`;
}

function allowlist(): string[] {
  const raw = Deno.env.get("OAUTH_REDIRECT_URI_ALLOWLIST") ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

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

async function issueAccessToken(clientId: string, scope: string): Promise<string> {
  const secret = requireEnv("OAUTH_TOKEN_HMAC_SECRET");
  if (secret.length < 32) throw new Error("weak_token_secret");
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(
    JSON.stringify({
      iss: "jules-mcp-oauth",
      sub: clientId,
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
    };
    if (body.iss !== "jules-mcp-oauth") return null;
    if (!body.exp || body.exp < Math.floor(Date.now() / 1000)) return null;
    if (!body.sub) return null;
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
      },
    },
  );
}

const app = new Hono();

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "jules-mcp-oauth",
    repository: FIXED_REPO,
    production_branch: FIXED_BRANCH,
    upstream: "jules-mcp (Bearer MCP_SHARED_SECRET, server-side only)",
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
    token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
    scopes_supported: ["mcp"],
  });
});

/** OAuth Protected Resource metadata (MCP clients) */
app.get("/.well-known/oauth-protected-resource", (c) => {
  const issuer = publicBase(c.req.raw);
  return c.json({
    resource: issuer,
    authorization_servers: [issuer],
    scopes_supported: ["mcp"],
    bearer_methods_supported: ["header"],
  });
});

/** Dynamic client registration (public PKCE clients, allowlisted redirects only) */
app.post("/register", async (c) => {
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return oauthError("invalid_client_metadata", "invalid JSON");
  }
  const redirectUris = Array.isArray(body.redirect_uris)
    ? body.redirect_uris.map(String)
    : [];
  if (redirectUris.length === 0) {
    return oauthError("invalid_redirect_uri", "redirect_uris required");
  }
  for (const u of redirectUris) {
    if (!redirectAllowed(u)) {
      return oauthError("invalid_redirect_uri", "redirect_uri not allowlisted");
    }
  }
  const clientId = crypto.randomUUID();
  const name =
    typeof body.client_name === "string" && body.client_name.trim()
      ? body.client_name.trim().slice(0, 128)
      : "mcp-connector";
  const sb = supabaseAdmin();
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
  const scope = q.scope ?? "mcp";

  if (responseType !== "code") {
    return oauthError("unsupported_response_type", "only code");
  }
  if (method !== "S256" || !challenge || challenge.length < 43) {
    return oauthError("invalid_request", "PKCE S256 required");
  }
  if (!redirectAllowed(redirectUri)) {
    return oauthError("invalid_request", "redirect_uri not allowlisted");
  }

  const sb = supabaseAdmin();
  const { data: client } = await sb
    .from("jules_mcp_oauth_clients")
    .select("client_id, redirect_uris")
    .eq("client_id", clientId)
    .maybeSingle();
  if (!client) return oauthError("invalid_client", "unknown client", 401);
  const uris = client.redirect_uris as string[];
  if (!uris.includes(redirectUri)) {
    return oauthError("invalid_request", "redirect_uri not registered");
  }

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Authorize Jules MCP</title>
<style>body{font-family:system-ui;max-width:480px;margin:2rem auto;padding:0 1rem}
button{padding:.6rem 1rem;margin-right:.5rem}input{width:100%;padding:.5rem;margin:.5rem 0}</style></head>
<body>
<h1>Authorize DR DHL Jules MCP</h1>
<p>Client: <code>${clientId}</code></p>
<p>Repository: <code>${FIXED_REPO}</code><br/>Branch: <code>${FIXED_BRANCH}</code></p>
<p>This grants MCP tool access only (no merge, no arbitrary repos).</p>
<form method="POST" action="">
<input type="hidden" name="client_id" value="${clientId}"/>
<input type="hidden" name="redirect_uri" value="${redirectUri.replace(/"/g, "&quot;")}"/>
<input type="hidden" name="state" value="${state.replace(/"/g, "&quot;")}"/>
<input type="hidden" name="code_challenge" value="${challenge.replace(/"/g, "&quot;")}"/>
<input type="hidden" name="code_challenge_method" value="S256"/>
<input type="hidden" name="scope" value="${scope.replace(/"/g, "&quot;")}"/>
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
  const approval = String(form.approval_secret ?? "");

  if (!redirectAllowed(redirectUri)) {
    return oauthError("invalid_request", "redirect_uri not allowlisted");
  }

  const deny = new URL(redirectUri);
  if (decision !== "approve") {
    deny.searchParams.set("error", "access_denied");
    if (state) deny.searchParams.set("state", state);
    return c.redirect(deny.toString(), 302);
  }

  const expected = Deno.env.get("OAUTH_OPERATOR_APPROVAL_SECRET") ?? "";
  if (expected.length < 16 || !timingSafeEqual(approval, expected)) {
    return oauthError("access_denied", "invalid operator approval", 403);
  }
  if (method !== "S256") {
    return oauthError("invalid_request", "PKCE S256 required");
  }

  const sb = supabaseAdmin();
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
  const { error } = await sb.from("jules_mcp_oauth_codes").insert({
    code_hash: codeHash,
    client_id: clientId,
    redirect_uri: redirectUri,
    code_challenge: challenge,
    code_challenge_method: "S256",
    scope,
    expires_at: expires,
  });
  if (error) return oauthError("server_error", "code issue failed", 500);

  const ok = new URL(redirectUri);
  ok.searchParams.set("code", code);
  if (state) ok.searchParams.set("state", state);
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
    const text = await c.req.text();
    params = new URLSearchParams(text);
  }

  const grant = params.get("grant_type") ?? "";
  const sb = supabaseAdmin();

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

    await sb
      .from("jules_mcp_oauth_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("code_hash", codeHash);

    const access = await issueAccessToken(clientId, row.scope);
    const refresh = b64url(crypto.getRandomValues(new Uint8Array(32)));
    const refreshHash = await sha256(refresh);
    await sb.from("jules_mcp_oauth_refresh_tokens").insert({
      token_hash: refreshHash,
      client_id: clientId,
      scope: row.scope,
      expires_at: new Date(Date.now() + REFRESH_TTL_SEC * 1000).toISOString(),
    });

    return c.json({
      access_token: access,
      token_type: "Bearer",
      expires_in: ACCESS_TTL_SEC,
      refresh_token: refresh,
      scope: row.scope,
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
    const access = await issueAccessToken(clientId, row.scope);
    return c.json({
      access_token: access,
      token_type: "Bearer",
      expires_in: ACCESS_TTL_SEC,
      scope: row.scope,
    });
  }

  return oauthError("unsupported_grant_type", "unsupported grant");
});

/** Proxy authenticated MCP traffic to jules-mcp */
app.all("/", proxyMcp);
app.all("/mcp", proxyMcp);
app.all("/*", async (c) => {
  // Allow OAuth paths only; anything else under function tries MCP proxy if authorized
  const path = new URL(c.req.url).pathname;
  if (
    path.includes("/authorize") ||
    path.includes("/token") ||
    path.includes("/register") ||
    path.includes("/.well-known/") ||
    path.endsWith("/health")
  ) {
    return c.json({ error: "not found" }, 404);
  }
  return proxyMcp(c);
});

async function proxyMcp(c: {
  req: { raw: Request; header: (n: string) => string | undefined };
}): Promise<Response> {
  const auth = c.req.header("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": `Bearer realm="jules-mcp-oauth", resource="${publicBase(c.req.raw)}"`,
      },
    });
  }
  const verified = await verifyAccessToken(m[1].trim());
  if (!verified) {
    return new Response(JSON.stringify({ error: "invalid_token" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  const upstream =
    Deno.env.get("JULES_MCP_UPSTREAM_URL") ??
    `${new URL(c.req.raw.url).origin}/functions/v1/jules-mcp`;
  // Prevent open proxy: only same-project jules-mcp path
  let upstreamUrl: URL;
  try {
    upstreamUrl = new URL(upstream);
  } catch {
    return new Response(JSON.stringify({ error: "misconfigured_upstream" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!upstreamUrl.pathname.endsWith("/jules-mcp")) {
    return new Response(JSON.stringify({ error: "invalid_upstream" }), {
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
  // Pass through body/status; strip any accidental secret leakage headers
  const outHeaders = new Headers();
  const pass = ["content-type", "cache-control", "mcp-session-id"];
  for (const h of pass) {
    const v = res.headers.get(h);
    if (v) outHeaders.set(h, v);
  }
  return new Response(res.body, { status: res.status, headers: outHeaders });
}

Deno.serve(app.fetch);
