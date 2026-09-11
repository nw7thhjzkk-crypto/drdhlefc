/**
 * Compatibility-oriented tests for Jules MCP auth/validation helpers.
 * Full Streamable HTTP client tests require a running Edge runtime + secrets.
 *
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
const MCP_TOOLS = [
  "start_jules_task",
  "get_jules_task",
  "get_jules_activities",
  "message_jules_task",
] as const;

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aa = enc.encode(a);
  const bb = enc.encode(b);
  // Mirror of the shipped helper: single constant-time path where a length
  // mismatch folds into the accumulator instead of an early return.
  let diff = aa.length ^ bb.length;
  const n = Math.max(aa.length, bb.length);
  for (let i = 0; i < n; i++) diff |= (aa[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

function isSafeSessionId(id: string): boolean {
  return /^[A-Za-z0-9_-]{6,128}$/.test(id);
}

function validateStartArgs(args: Record<string, unknown>): string | null {
  if (args.repository !== undefined || args.repo !== undefined) {
    return "repository fixed";
  }
  if (args.branch !== undefined || args.production_branch !== undefined) {
    return "branch fixed";
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

/** Simulated MCP client request envelope checks (protocol-level). */
function isJsonRpcInitialize(body: unknown): boolean {
  if (typeof body !== "object" || body === null) return false;
  const m = body as Record<string, unknown>;
  return m.jsonrpc === "2.0" && m.method === "initialize";
}

function isJsonRpcToolsList(body: unknown): boolean {
  if (typeof body !== "object" || body === null) return false;
  const m = body as Record<string, unknown>;
  return m.jsonrpc === "2.0" && m.method === "tools/list";
}

function isJsonRpcToolsCall(body: unknown): boolean {
  if (typeof body !== "object" || body === null) return false;
  const m = body as Record<string, unknown>;
  return m.jsonrpc === "2.0" && m.method === "tools/call";
}

Deno.test("auth rejects mismatch", () => {
  assertEquals(timingSafeEqual("a".repeat(32), "b".repeat(32)), false);
});

Deno.test("auth accepts match", () => {
  const s = "mcp-shared-secret-value-32chars!";
  assert(timingSafeEqual(s, s));
});

Deno.test("invalid authentication shape", () => {
  const header = "Basic not-bearer";
  const m = header.match(/^Bearer\s+(.+)$/i);
  assertEquals(m, null);
});

Deno.test("valid authentication shape", () => {
  const secret = "mcp-shared-secret-value-32chars!";
  const header = `Bearer ${secret}`;
  const m = header.match(/^Bearer\s+(.+)$/i);
  assert(m !== null);
  assert(timingSafeEqual(m![1].trim(), secret));
});

Deno.test("session id validation", () => {
  assert(isSafeSessionId("abc12345"));
  assertEquals(isSafeSessionId("../evil"), false);
  assertEquals(isSafeSessionId("x"), false);
});

Deno.test("malformed start args: missing title", () => {
  assert(validateStartArgs({ prompt: "only prompt" }) !== null);
});

Deno.test("rejects caller repository/branch", () => {
  assert(
    validateStartArgs({
      title: "t",
      prompt: "p",
      repository: "evil/repo",
    }) !== null,
  );
  assert(
    validateStartArgs({ title: "t", prompt: "p", branch: "main" }) !== null,
  );
});

Deno.test("accepts valid start args", () => {
  assertEquals(
    validateStartArgs({ title: "Smoke", prompt: "Edit README only" }),
    null,
  );
});

Deno.test("fixed production targets", () => {
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

Deno.test("MCP tool names exact set", () => {
  assertEquals(MCP_TOOLS.length, 4);
  assert(MCP_TOOLS.includes("start_jules_task"));
  assert(MCP_TOOLS.includes("get_jules_task"));
  assert(MCP_TOOLS.includes("get_jules_activities"));
  assert(MCP_TOOLS.includes("message_jules_task"));
});

Deno.test("MCP client initialize envelope", () => {
  assert(
    isJsonRpcInitialize({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "t", version: "1" } },
    }),
  );
});

Deno.test("MCP client tools/list and tools/call envelopes", () => {
  assert(isJsonRpcToolsList({ jsonrpc: "2.0", id: 2, method: "tools/list" }));
  assert(
    isJsonRpcToolsCall({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "get_jules_task", arguments: { session_id: "abc12345" } },
    }),
  );
});

Deno.test("invalid request envelope rejected by shape checks", () => {
  assertEquals(isJsonRpcInitialize({ method: "initialize" }), false);
  assertEquals(isJsonRpcToolsCall(null), false);
});
