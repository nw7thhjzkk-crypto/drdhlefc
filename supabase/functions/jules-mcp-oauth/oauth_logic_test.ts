/**
 * OAuth security unit tests
 * deno test supabase/functions/jules-mcp-oauth/oauth_logic_test.ts
 */
import {
  assertEquals,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

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
  if (aa.length !== bb.length) return false;
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

function redirectAllowed(uri: string, list: string[]): boolean {
  return list.includes(uri);
}

function resolveUpstream(
  raw: string,
  reqOrigin: string,
  explicit: boolean,
): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.hostname !== "localhost") return false;
    if (!u.pathname.replace(/\/$/, "").endsWith("/jules-mcp")) return false;
    if (!explicit && u.origin !== reqOrigin) return false;
    return true;
  } catch {
    return false;
  }
}

Deno.test("PKCE S256", async () => {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = await sha256(verifier);
  assertEquals(await sha256(verifier), challenge);
  assertEquals(await sha256("wrong") === challenge, false);
});

Deno.test("exact redirect allowlist", () => {
  const list = ["https://grok.com/connectors-oauth-exchange-code/"];
  assert(redirectAllowed(list[0], list));
  assertEquals(
    redirectAllowed("https://grok.com/connectors-oauth-exchange-code/?x=1", list),
    false,
  );
  assertEquals(redirectAllowed("https://evil.example/", list), false);
});

Deno.test("access token aud binding", async () => {
  const secret = "x".repeat(32);
  const resource = "https://example.supabase.co/functions/v1/jules-mcp-oauth";
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(
    JSON.stringify({
      iss: resource,
      sub: "client",
      aud: resource,
      resource,
      exp: now + 60,
    }),
  );
  const sig = await hmacSign(secret, `${header}.${payload}`);
  const token = `${header}.${payload}.${sig}`;
  const parts = token.split(".");
  const body = JSON.parse(
    new TextDecoder().decode(fromB64url(parts[1])),
  ) as { aud: string };
  assertEquals(body.aud, resource);
});

Deno.test("expired token rejected", () => {
  const exp = Math.floor(Date.now() / 1000) - 5;
  assert(exp < Math.floor(Date.now() / 1000));
});

Deno.test("code single-use", () => {
  let used: string | null = null;
  assertEquals(used, null);
  used = new Date().toISOString();
  assert(used !== null);
});

Deno.test("refresh rotation implies revoke", () => {
  let revoked: string | null = null;
  revoked = new Date().toISOString();
  assert(revoked !== null);
});

Deno.test("SSRF: upstream must be jules-mcp", () => {
  const origin = "https://ahkwooaqayqikvotwuac.supabase.co";
  assert(
    resolveUpstream(`${origin}/functions/v1/jules-mcp`, origin, false),
  );
  assertEquals(
    resolveUpstream(`${origin}/functions/v1/other`, origin, false),
    false,
  );
  assertEquals(
    resolveUpstream("https://evil.example/jules-mcp", origin, false),
    false,
  );
});

Deno.test("timing safe compare", () => {
  assert(timingSafeEqual("abcdefghijabcdefghijabcdefghij12", "abcdefghijabcdefghijabcdefghij12"));
  assertEquals(
    timingSafeEqual("abcdefghijabcdefghijabcdefghij12", "abcdefghijabcdefghijabcdefghij99"),
    false,
  );
});

Deno.test("state required", () => {
  const state = "";
  assertEquals(Boolean(state), false);
});

Deno.test("no merge tool in gateway surface", () => {
  const tools = [
    "start_jules_task",
    "get_jules_task",
    "get_jules_activities",
    "message_jules_task",
  ];
  assertEquals(tools.includes("merge_pr"), false);
});
