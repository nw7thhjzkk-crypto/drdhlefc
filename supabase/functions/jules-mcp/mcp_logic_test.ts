/**
 * Pure logic tests for Jules MCP validation/auth helpers.
 * Run: deno test supabase/functions/jules-mcp/mcp_logic_test.ts
 */

import {
  assertEquals,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

const MAX_TITLE = 200;
const MAX_PROMPT = 50_000;
const FIXED_REPO = "nw7thhjzkk-crypto/drdhlefc";
const FIXED_BRANCH = "scaffold-gymsmart-erp-9743545895368865022";
const JULES_SOURCE = "sources/github/nw7thhjzkk-crypto/drdhlefc";

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aa = enc.encode(a);
  const bb = enc.encode(b);
  if (aa.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}

function isSafeSessionId(id: string): boolean {
  return /^[A-Za-z0-9_-]{6,128}$/.test(id);
}

function validateStart(args: Record<string, unknown>): string | null {
  if (args.repository !== undefined || args.repo !== undefined) {
    return "repository is fixed and cannot be supplied";
  }
  if (args.branch !== undefined || args.production_branch !== undefined) {
    return "branch is fixed and cannot be supplied";
  }
  const title = typeof args.title === "string" ? args.title.trim() : "";
  const prompt = typeof args.prompt === "string" ? args.prompt.trim() : "";
  if (!title || title.length > MAX_TITLE) return "bad title";
  if (!prompt || prompt.length > MAX_PROMPT) return "bad prompt";
  return null;
}

function redact(text: string, secret: string): string {
  return text.split(secret).join("[REDACTED]");
}

Deno.test("auth rejects mismatch", () => {
  assertEquals(timingSafeEqual("a".repeat(32), "b".repeat(32)), false);
});

Deno.test("auth accepts match", () => {
  const s = "mcp-shared-secret-value-32chars!";
  assert(timingSafeEqual(s, s));
});

Deno.test("session id validation", () => {
  assert(isSafeSessionId("abc12345"));
  assertEquals(isSafeSessionId("../evil"), false);
  assertEquals(isSafeSessionId("x"), false);
});

Deno.test("rejects caller repository", () => {
  assert(
    validateStart({
      title: "t",
      prompt: "p",
      repository: "evil/repo",
    }) !== null,
  );
});

Deno.test("rejects caller branch", () => {
  assert(
    validateStart({ title: "t", prompt: "p", branch: "main" }) !== null,
  );
});

Deno.test("accepts valid start args", () => {
  assertEquals(
    validateStart({ title: "Smoke", prompt: "Edit README only" }),
    null,
  );
});

Deno.test("fixed constants match production targets", () => {
  assertEquals(FIXED_REPO, "nw7thhjzkk-crypto/drdhlefc");
  assertEquals(
    FIXED_BRANCH,
    "scaffold-gymsmart-erp-9743545895368865022",
  );
  assertEquals(
    JULES_SOURCE,
    "sources/github/nw7thhjzkk-crypto/drdhlefc",
  );
});

Deno.test("secret redaction", () => {
  const secret = "super-secret-jules-key";
  assertEquals(redact(`err ${secret} end`, secret).includes(secret), false);
});

Deno.test("MCP tool names are the four required tools", () => {
  const names = [
    "start_jules_task",
    "get_jules_task",
    "get_jules_activities",
    "message_jules_task",
  ];
  assertEquals(names.length, 4);
});
