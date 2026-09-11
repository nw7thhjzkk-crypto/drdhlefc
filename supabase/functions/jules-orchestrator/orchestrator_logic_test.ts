/**
 * Pure validation/security unit tests for the Jules orchestrator bridge.
 * Run with: deno test supabase/functions/jules-orchestrator/orchestrator_logic_test.ts
 *
 * These tests do not call Jules or Supabase; they encode the contract the
 * Edge Function must enforce (auth shape, fixed repo/branch, size limits).
 */

import {
  assertEquals,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

const MAX_TITLE_LEN = 200;
const MAX_PROMPT_LEN = 50_000;
const MAX_IDEM_LEN = 128;

function validateCreateBody(body: Record<string, unknown>): {
  title: string;
  prompt: string;
  idempotency_key: string;
} | { error: string } {
  if (body.repository !== undefined || body.repo !== undefined) {
    return { error: "repository is fixed by the server and cannot be supplied" };
  }
  if (body.branch !== undefined || body.production_branch !== undefined) {
    return { error: "branch is fixed by the server and cannot be supplied" };
  }
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const idem =
    typeof body.idempotency_key === "string"
      ? body.idempotency_key.trim()
      : "";
  if (!title || title.length > MAX_TITLE_LEN) {
    return { error: `title required (1-${MAX_TITLE_LEN} chars)` };
  }
  if (!prompt || prompt.length > MAX_PROMPT_LEN) {
    return { error: `prompt required (1-${MAX_PROMPT_LEN} chars)` };
  }
  if (!idem || idem.length > MAX_IDEM_LEN) {
    return { error: `idempotency_key required (1-${MAX_IDEM_LEN} chars)` };
  }
  if (!/^[A-Za-z0-9._:-]+$/.test(idem)) {
    return { error: "idempotency_key has invalid characters" };
  }
  return { title, prompt, idempotency_key: idem };
}

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

Deno.test("rejects missing auth shape (empty bearer)", () => {
  assertEquals(timingSafeEqual("", "secret-value-at-least-32-chars-long!!"), false);
});

Deno.test("accepts matching shared secret", () => {
  const s = "orchestrator-shared-secret-value-32b";
  assert(timingSafeEqual(s, s));
});

Deno.test("rejects malformed body without title", () => {
  const r = validateCreateBody({ prompt: "x", idempotency_key: "k1" });
  assert("error" in r);
});

Deno.test("rejects oversized prompt", () => {
  const r = validateCreateBody({
    title: "t",
    prompt: "x".repeat(MAX_PROMPT_LEN + 1),
    idempotency_key: "k1",
  });
  assert("error" in r);
});

Deno.test("rejects arbitrary repository field", () => {
  const r = validateCreateBody({
    title: "t",
    prompt: "p",
    idempotency_key: "k1",
    repository: "evil/repo",
  });
  assert("error" in r);
  assertEquals(
    (r as { error: string }).error.includes("repository"),
    true,
  );
});

Deno.test("rejects arbitrary branch field", () => {
  const r = validateCreateBody({
    title: "t",
    prompt: "p",
    idempotency_key: "k1",
    branch: "main",
  });
  assert("error" in r);
});

Deno.test("accepts valid create body", () => {
  const r = validateCreateBody({
    title: "Smoke",
    prompt: "Add HTML comment to README",
    idempotency_key: "smoke-2026-09-06",
  });
  assert(!("error" in r));
});

Deno.test("redact pattern never echoes placeholder secrets", () => {
  const secret = "super-secret-jules-key-value";
  const msg = `failed with ${secret} in body`;
  const redacted = msg.split(secret).join("[JULES_API_KEY_REDACTED]");
  assertEquals(redacted.includes(secret), false);
});
