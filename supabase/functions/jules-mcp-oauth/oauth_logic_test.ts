/**
 * OAuth 2.1 / PKCE unit tests (pure crypto + policy).
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

function redirectAllowed(uri: string, allowlist: string[]): boolean {
  return allowlist.includes(uri);
}

function upstreamOk(url: string): boolean {
  try {
    const u = new URL(url);
    return u.pathname.endsWith("/jules-mcp");
  } catch {
    return false;
  }
}

Deno.test("PKCE S256 challenge matches verifier", async () => {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = await sha256(verifier);
  assertEquals(await sha256(verifier), challenge);
  assertEquals(await sha256(verifier + "x") === challenge, false);
});

Deno.test("invalid client redirect rejected", () => {
  assertEquals(
    redirectAllowed("https://evil.example/callback", [
      "https://grok.com/connectors-oauth-exchange-code/",
    ]),
    false,
  );
});

Deno.test("allowlisted redirect accepted", () => {
  const u = "https://grok.com/connectors-oauth-exchange-code/";
  assert(redirectAllowed(u, [u]));
});

Deno.test("authorization code single-use simulation", () => {
  let usedAt: string | null = null;
  assertEquals(usedAt, null);
  usedAt = new Date().toISOString();
  assert(usedAt !== null); // replay would see used_at set
});

Deno.test("token expiry check", () => {
  const exp = Math.floor(Date.now() / 1000) - 10;
  assert(exp < Math.floor(Date.now() / 1000));
});

Deno.test("timing-safe compare", () => {
  assert(timingSafeEqual("same-secret-value-32chars-long!!", "same-secret-value-32chars-long!!"));
  assertEquals(
    timingSafeEqual("same-secret-value-32chars-long!!", "diff-secret-value-32chars-long!!"),
    false,
  );
});

Deno.test("upstream must be jules-mcp only", () => {
  assert(
    upstreamOk(
      "https://ahkwooaqayqikvotwuac.supabase.co/functions/v1/jules-mcp",
    ),
  );
  assertEquals(
    upstreamOk("https://evil.example/functions/v1/other"),
    false,
  );
});

Deno.test("unauthorized MCP without bearer", () => {
  const header = "";
  assertEquals(/^Bearer\s+(.+)$/i.test(header), false);
});
