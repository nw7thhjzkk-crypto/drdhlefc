/**
 * Jules Orchestrator Bridge
 *
 * Authenticated service-to-service HTTPS bridge:
 *   External orchestrator → this Edge Function → Jules API → PR → CI → auto-merge
 *
 * Auth: Authorization: Bearer <ORCHESTRATOR_SHARED_SECRET>
 * Secrets (Deno.env only; never logged or returned):
 *   - ORCHESTRATOR_SHARED_SECRET
 *   - JULES_API_KEY
 *   - SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (platform-injected)
 *
 * Fixed targets (caller cannot override):
 *   repository: nw7thhjzkk-crypto/drdhlefc
 *   branch:     scaffold-gymsmart-erp-9743545895368865022
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const FIXED_REPO = "nw7thhjzkk-crypto/drdhlefc";
const FIXED_BRANCH = "scaffold-gymsmart-erp-9743545895368865022";
/** Jules source resource name (GitHub-connected source). */
const JULES_SOURCE = "sources/github/nw7thhjzkk-crypto/drdhlefc";
const JULES_API_BASE = "https://jules.googleapis.com/v1alpha";

const MAX_TITLE_LEN = 200;
const MAX_PROMPT_LEN = 50_000;
const MAX_IDEM_LEN = 128;
const MAX_MESSAGE_LEN = 20_000;

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function safeError(message: string, status: number): Response {
  return json({ ok: false, error: message }, status);
}

/** Constant-time string compare to reduce timing leaks on the shared secret. */
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aa = enc.encode(a);
  const bb = enc.encode(b);
  if (aa.length !== bb.length) {
    // Still run a dummy compare to avoid trivial length oracle on secret size
    let d = 0;
    const n = Math.max(aa.length, bb.length);
    for (let i = 0; i < n; i++) {
      d |= (aa[i] ?? 0) ^ (bb[i] ?? 0);
    }
    return false;
  }
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}

function requireEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing required environment configuration`);
  return v;
}

function authenticate(req: Request): boolean {
  const expected = Deno.env.get("ORCHESTRATOR_SHARED_SECRET");
  if (!expected || expected.length < 32) return false;
  const header = req.headers.get("authorization") ?? "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return false;
  return timingSafeEqual(m[1].trim(), expected);
}

function redactSecrets(text: string): string {
  let out = text;
  for (const key of [
    "JULES_API_KEY",
    "ORCHESTRATOR_SHARED_SECRET",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]) {
    const val = Deno.env.get(key);
    if (val && val.length > 8) {
      out = out.split(val).join(`[${key}_REDACTED]`);
    }
  }
  return out;
}

function supabaseAdmin() {
  const url = requireEnv("SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function parsePath(pathname: string): {
  action: "create" | "status" | "message" | "health" | null;
  id?: string;
} {
  // Function is mounted at /functions/v1/jules-orchestrator
  // Accept trailing paths: /create, /status/:id, /message/:id, /
  const base = pathname.replace(/\/+$/, "") || "/";
  const parts = base.split("/").filter(Boolean);
  // parts may be ["jules-orchestrator", ...] or ["create"] depending on gateway
  const idx = parts.lastIndexOf("jules-orchestrator");
  const rest = idx >= 0 ? parts.slice(idx + 1) : parts;

  if (rest.length === 0) return { action: "health" };
  if (rest[0] === "create") return { action: "create" };
  if (rest[0] === "status" && rest[1]) return { action: "status", id: rest[1] };
  if (rest[0] === "message" && rest[1]) {
    return { action: "message", id: rest[1] };
  }
  return { action: null };
}

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

async function julesCreateSession(
  title: string,
  prompt: string,
): Promise<{ id: string; url?: string; name?: string }> {
  const apiKey = requireEnv("JULES_API_KEY");
  const res = await fetch(`${JULES_API_BASE}/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      title,
      prompt,
      sourceContext: {
        source: JULES_SOURCE,
        githubRepoContext: { startingBranch: FIXED_BRANCH },
      },
      automationMode: "AUTO_CREATE_PR",
      requirePlanApproval: false,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `Jules session create failed (${res.status}): ${redactSecrets(text).slice(0, 400)}`,
    );
  }
  const data = JSON.parse(text) as {
    id?: string;
    name?: string;
    url?: string;
  };
  const id = data.id ?? data.name?.replace(/^sessions\//, "");
  if (!id) throw new Error("Jules response missing session id");
  return { id, url: data.url, name: data.name };
}

async function julesGetSession(sessionId: string): Promise<Record<string, unknown>> {
  const apiKey = requireEnv("JULES_API_KEY");
  const res = await fetch(`${JULES_API_BASE}/sessions/${sessionId}`, {
    headers: { "x-goog-api-key": apiKey },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `Jules get session failed (${res.status}): ${redactSecrets(text).slice(0, 400)}`,
    );
  }
  return JSON.parse(text) as Record<string, unknown>;
}

async function julesSendMessage(sessionId: string, prompt: string): Promise<void> {
  const apiKey = requireEnv("JULES_API_KEY");
  const res = await fetch(
    `${JULES_API_BASE}/sessions/${sessionId}:sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({ prompt }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Jules sendMessage failed (${res.status}): ${redactSecrets(text).slice(0, 400)}`,
    );
  }
}

async function handleCreate(req: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return safeError("invalid JSON body", 400);
  }

  const parsed = validateCreateBody(body);
  if ("error" in parsed) return safeError(parsed.error, 400);

  const sb = supabaseAdmin();

  // Idempotent insert first — UNIQUE(idempotency_key)
  const { data: inserted, error: insertErr } = await sb
    .from("jules_orchestration_requests")
    .insert({
      idempotency_key: parsed.idempotency_key,
      title: parsed.title,
      prompt: parsed.prompt,
      repository: FIXED_REPO,
      production_branch: FIXED_BRANCH,
      status: "pending",
    })
    .select("request_id, status, jules_session_id")
    .maybeSingle();

  if (insertErr) {
    // Unique violation → return existing
    if (insertErr.code === "23505") {
      const { data: existing } = await sb
        .from("jules_orchestration_requests")
        .select(
          "request_id, status, jules_session_id, jules_session_url, error_message",
        )
        .eq("idempotency_key", parsed.idempotency_key)
        .maybeSingle();
      if (!existing) return safeError("idempotent lookup failed", 500);
      return json({
        ok: true,
        request_id: existing.request_id,
        jules_session_id: existing.jules_session_id,
        status: existing.status,
        deduplicated: true,
      });
    }
    console.error("insert error", redactSecrets(insertErr.message));
    return safeError("failed to persist request", 500);
  }

  if (!inserted) return safeError("failed to persist request", 500);

  try {
    const session = await julesCreateSession(parsed.title, parsed.prompt);
    const { error: updErr } = await sb
      .from("jules_orchestration_requests")
      .update({
        jules_session_id: session.id,
        jules_session_url: session.url ?? null,
        status: "created",
        updated_at: new Date().toISOString(),
      })
      .eq("request_id", inserted.request_id);

    if (updErr) {
      console.error("update after create", redactSecrets(updErr.message));
    }

    return json({
      ok: true,
      request_id: inserted.request_id,
      jules_session_id: session.id,
      status: "created",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown Jules error";
    await sb
      .from("jules_orchestration_requests")
      .update({
        status: "failed",
        error_message: redactSecrets(msg).slice(0, 1000),
        updated_at: new Date().toISOString(),
      })
      .eq("request_id", inserted.request_id);

    return safeError("Jules session creation failed", 502);
  }
}

async function handleStatus(requestId: string): Promise<Response> {
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) {
    return safeError("invalid request_id", 400);
  }
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("jules_orchestration_requests")
    .select(
      "request_id, title, status, jules_session_id, jules_session_url, repository, production_branch, error_message, created_at, updated_at",
    )
    .eq("request_id", requestId)
    .maybeSingle();

  if (error) {
    console.error("status query", redactSecrets(error.message));
    return safeError("status lookup failed", 500);
  }
  if (!data) return safeError("not found", 404);

  let jules_state: unknown = null;
  if (data.jules_session_id) {
    try {
      const session = await julesGetSession(data.jules_session_id);
      jules_state = {
        state: session.state ?? null,
        url: session.url ?? data.jules_session_url ?? null,
        outputs: session.outputs ?? null,
      };
      if (session.state === "COMPLETED" && data.status === "created") {
        await sb
          .from("jules_orchestration_requests")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("request_id", requestId);
        data.status = "completed";
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "jules poll failed";
      console.error("jules poll", redactSecrets(msg));
    }
  }

  return json({
    ok: true,
    request: data,
    jules: jules_state,
  });
}

async function handleMessage(
  req: Request,
  requestId: string,
): Promise<Response> {
  if (!/^[0-9a-f-]{36}$/i.test(requestId)) {
    return safeError("invalid request_id", 400);
  }
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return safeError("invalid JSON body", 400);
  }
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt || prompt.length > MAX_MESSAGE_LEN) {
    return safeError(`prompt required (1-${MAX_MESSAGE_LEN} chars)`, 400);
  }

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("jules_orchestration_requests")
    .select("request_id, jules_session_id, status")
    .eq("request_id", requestId)
    .maybeSingle();

  if (error) return safeError("lookup failed", 500);
  if (!data) return safeError("not found", 404);
  if (!data.jules_session_id) {
    return safeError("no Jules session for this request", 409);
  }

  try {
    await julesSendMessage(data.jules_session_id, prompt);
    await sb
      .from("jules_orchestration_requests")
      .update({
        status: "message_sent",
        updated_at: new Date().toISOString(),
      })
      .eq("request_id", requestId);
    return json({ ok: true, request_id: requestId, status: "message_sent" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "send failed";
    console.error("sendMessage", redactSecrets(msg));
    return safeError("failed to send message to Jules", 502);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!authenticate(req)) {
      return safeError("unauthorized", 401);
    }

    const url = new URL(req.url);
    const { action, id } = parsePath(url.pathname);

    if (action === "health" && req.method === "GET") {
      return json({
        ok: true,
        service: "jules-orchestrator",
        repository: FIXED_REPO,
        production_branch: FIXED_BRANCH,
      });
    }

    if (action === "create" && req.method === "POST") {
      return await handleCreate(req);
    }
    if (action === "status" && req.method === "GET" && id) {
      return await handleStatus(id);
    }
    if (action === "message" && req.method === "POST" && id) {
      return await handleMessage(req, id);
    }

    return safeError("not found", 404);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "internal error";
    console.error("unhandled", redactSecrets(msg));
    return safeError("internal error", 500);
  }
});
