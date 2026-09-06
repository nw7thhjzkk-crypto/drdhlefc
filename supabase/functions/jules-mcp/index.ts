/**
 * Jules MCP Server (Phase 1) — Streamable HTTP transport
 *
 * Grok / xAI custom MCP connector compatible:
 *   Authorization: Bearer <MCP_SHARED_SECRET>
 *   POST JSON-RPC 2.0 to this function URL (Streamable HTTP)
 *
 * Tools (fixed repo/branch only):
 *   start_jules_task | get_jules_task | get_jules_activities | message_jules_task
 *
 * Secrets (env only; never logged or returned):
 *   MCP_SHARED_SECRET, JULES_API_KEY,
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const FIXED_REPO = "nw7thhjzkk-crypto/drdhlefc";
const FIXED_BRANCH = "scaffold-gymsmart-erp-9743545895368865022";
const JULES_SOURCE = "sources/github/nw7thhjzkk-crypto/drdhlefc";
const JULES_API_BASE = "https://jules.googleapis.com/v1alpha";
const PROTOCOL_VERSION = "2025-03-26";
const SERVER_INFO = { name: "drdhlefc-jules-mcp", version: "1.0.0" };

const MAX_TITLE = 200;
const MAX_PROMPT = 50_000;
const MAX_IDEM = 128;
const MAX_MESSAGE = 20_000;
const MAX_CREATES_PER_HOUR = 20;
const MAX_MESSAGES_PER_HOUR = 60;

const TOOLS = [
  {
    name: "start_jules_task",
    description:
      "Start a Jules coding session on nw7thhjzkk-crypto/drdhlefc (fixed production branch, AUTO_CREATE_PR). Repository and branch cannot be overridden.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short task title" },
        prompt: { type: "string", description: "Full task instructions for Jules" },
        idempotency_key: {
          type: "string",
          description: "Optional unique key to prevent duplicate sessions",
        },
      },
      required: ["title", "prompt"],
    },
  },
  {
    name: "get_jules_task",
    description: "Get safe status/metadata for a Jules session by session_id.",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string", description: "Jules session id" },
      },
      required: ["session_id"],
    },
  },
  {
    name: "get_jules_activities",
    description: "List Jules activity/progress events for a session.",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string", description: "Jules session id" },
      },
      required: ["session_id"],
    },
  },
  {
    name: "message_jules_task",
    description: "Send a follow-up message to an existing Jules session.",
    inputSchema: {
      type: "object",
      properties: {
        session_id: { type: "string", description: "Jules session id" },
        message: { type: "string", description: "Follow-up instructions" },
      },
      required: ["session_id", "message"],
    },
  },
] as const;

type JsonRpcId = string | number | null;

function jsonRpcResult(id: JsonRpcId, result: unknown): Response {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function jsonRpcError(
  id: JsonRpcId,
  code: number,
  message: string,
  httpStatus = 200,
): Response {
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }),
    {
      status: httpStatus,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    },
  );
}

function httpError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
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

function requireEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error("Missing required environment configuration");
  return v;
}

function authenticate(req: Request): boolean {
  const expected = Deno.env.get("MCP_SHARED_SECRET");
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
    "MCP_SHARED_SECRET",
    "ORCHESTRATOR_SHARED_SECRET",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]) {
    const val = Deno.env.get(key);
    if (val && val.length > 8) out = out.split(val).join(`[${key}_REDACTED]`);
  }
  return out;
}

function isSafeSessionId(id: string): boolean {
  return /^[A-Za-z0-9_-]{6,128}$/.test(id);
}

function supabaseAdmin() {
  return createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function julesFetch(
  path: string,
  init?: RequestInit,
): Promise<Record<string, unknown>> {
  const apiKey = requireEnv("JULES_API_KEY");
  const res = await fetch(`${JULES_API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `Jules API ${res.status}: ${redactSecrets(text).slice(0, 400)}`,
    );
  }
  if (!text) return {};
  return JSON.parse(text) as Record<string, unknown>;
}

function sanitizeSession(session: Record<string, unknown>) {
  return {
    id: session.id ?? null,
    name: session.name ?? null,
    title: session.title ?? null,
    state: session.state ?? null,
    url: session.url ?? null,
    createTime: session.createTime ?? null,
    updateTime: session.updateTime ?? null,
    outputs: session.outputs ?? null,
  };
}

function sanitizeActivities(payload: Record<string, unknown>) {
  const acts = Array.isArray(payload.activities) ? payload.activities : [];
  return {
    activities: acts.map((a) => {
      const x = a as Record<string, unknown>;
      return {
        id: x.id ?? null,
        name: x.name ?? null,
        originator: x.originator ?? null,
        description: x.description ?? null,
        createTime: x.createTime ?? null,
      };
    }),
    nextPageToken: payload.nextPageToken ?? null,
  };
}

async function rateLimitCreates(
  sb: ReturnType<typeof supabaseAdmin>,
): Promise<string | null> {
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count, error } = await sb
    .from("jules_orchestration_requests")
    .select("request_id", { count: "exact", head: true })
    .gte("created_at", since);
  if (error) return "rate limit check failed";
  if ((count ?? 0) >= MAX_CREATES_PER_HOUR) return "rate limit exceeded";
  return null;
}

async function toolStart(args: Record<string, unknown>) {
  const title = typeof args.title === "string" ? args.title.trim() : "";
  const prompt = typeof args.prompt === "string" ? args.prompt.trim() : "";
  let idem =
    typeof args.idempotency_key === "string"
      ? args.idempotency_key.trim()
      : crypto.randomUUID();

  if (args.repository !== undefined || args.repo !== undefined) {
    throw new Error("repository is fixed and cannot be supplied");
  }
  if (args.branch !== undefined || args.production_branch !== undefined) {
    throw new Error("branch is fixed and cannot be supplied");
  }
  if (!title || title.length > MAX_TITLE) {
    throw new Error(`title required (1-${MAX_TITLE} chars)`);
  }
  if (!prompt || prompt.length > MAX_PROMPT) {
    throw new Error(`prompt required (1-${MAX_PROMPT} chars)`);
  }
  if (!idem || idem.length > MAX_IDEM || !/^[A-Za-z0-9._:-]+$/.test(idem)) {
    throw new Error("invalid idempotency_key");
  }

  const sb = supabaseAdmin();
  const limited = await rateLimitCreates(sb);
  if (limited) throw new Error(limited);

  const { data: inserted, error: insertErr } = await sb
    .from("jules_orchestration_requests")
    .insert({
      idempotency_key: `mcp:${idem}`,
      title,
      prompt,
      repository: FIXED_REPO,
      production_branch: FIXED_BRANCH,
      status: "pending",
    })
    .select("request_id, status, jules_session_id, jules_session_url")
    .maybeSingle();

  if (insertErr?.code === "23505") {
    const { data: existing } = await sb
      .from("jules_orchestration_requests")
      .select("request_id, status, jules_session_id, jules_session_url")
      .eq("idempotency_key", `mcp:${idem}`)
      .maybeSingle();
    if (!existing) throw new Error("idempotent lookup failed");
    return {
      ok: true,
      deduplicated: true,
      request_id: existing.request_id,
      session_id: existing.jules_session_id,
      session_url: existing.jules_session_url,
      status: existing.status,
      repository: FIXED_REPO,
      production_branch: FIXED_BRANCH,
    };
  }
  if (insertErr || !inserted) {
    console.error("insert", redactSecrets(insertErr?.message ?? "none"));
    throw new Error("failed to persist request");
  }

  try {
    const session = await julesFetch("/sessions", {
      method: "POST",
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
    const sid =
      (typeof session.id === "string" && session.id) ||
      (typeof session.name === "string"
        ? session.name.replace(/^sessions\//, "")
        : "");
    if (!sid || !isSafeSessionId(sid)) {
      throw new Error("Jules response missing or invalid session id");
    }
    const url = typeof session.url === "string" ? session.url : null;
    await sb
      .from("jules_orchestration_requests")
      .update({
        jules_session_id: sid,
        jules_session_url: url,
        status: "created",
        updated_at: new Date().toISOString(),
      })
      .eq("request_id", inserted.request_id);

    return {
      ok: true,
      deduplicated: false,
      request_id: inserted.request_id,
      session_id: sid,
      session_url: url,
      status: "created",
      repository: FIXED_REPO,
      production_branch: FIXED_BRANCH,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "jules error";
    await sb
      .from("jules_orchestration_requests")
      .update({
        status: "failed",
        error_message: redactSecrets(msg).slice(0, 1000),
        updated_at: new Date().toISOString(),
      })
      .eq("request_id", inserted.request_id);
    throw new Error("Jules session creation failed");
  }
}

async function toolGetTask(args: Record<string, unknown>) {
  const sessionId =
    typeof args.session_id === "string" ? args.session_id.trim() : "";
  if (!isSafeSessionId(sessionId)) throw new Error("invalid session_id");
  const session = await julesFetch(`/sessions/${sessionId}`);
  return { ok: true, session: sanitizeSession(session) };
}

async function toolGetActivities(args: Record<string, unknown>) {
  const sessionId =
    typeof args.session_id === "string" ? args.session_id.trim() : "";
  if (!isSafeSessionId(sessionId)) throw new Error("invalid session_id");
  const payload = await julesFetch(
    `/sessions/${sessionId}/activities?pageSize=50`,
  );
  return { ok: true, ...sanitizeActivities(payload) };
}

async function toolMessage(args: Record<string, unknown>) {
  const sessionId =
    typeof args.session_id === "string" ? args.session_id.trim() : "";
  const message =
    typeof args.message === "string" ? args.message.trim() : "";
  if (!isSafeSessionId(sessionId)) throw new Error("invalid session_id");
  if (!message || message.length > MAX_MESSAGE) {
    throw new Error(`message required (1-${MAX_MESSAGE} chars)`);
  }

  const sb = supabaseAdmin();
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await sb
    .from("jules_orchestration_requests")
    .select("request_id", { count: "exact", head: true })
    .eq("status", "message_sent")
    .gte("updated_at", since);
  if ((count ?? 0) >= MAX_MESSAGES_PER_HOUR) {
    throw new Error("message rate limit exceeded");
  }

  await julesFetch(`/sessions/${sessionId}:sendMessage`, {
    method: "POST",
    body: JSON.stringify({ prompt: message }),
  });

  await sb
    .from("jules_orchestration_requests")
    .update({
      status: "message_sent",
      updated_at: new Date().toISOString(),
    })
    .eq("jules_session_id", sessionId);

  return { ok: true, session_id: sessionId, status: "message_sent" };
}

async function callTool(
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  switch (name) {
    case "start_jules_task":
      return await toolStart(args);
    case "get_jules_task":
      return await toolGetTask(args);
    case "get_jules_activities":
      return await toolGetActivities(args);
    case "message_jules_task":
      return await toolMessage(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function toolResultContent(data: unknown) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}

async function handleJsonRpc(msg: Record<string, unknown>): Promise<Response> {
  const id = (msg.id as JsonRpcId) ?? null;
  const method = typeof msg.method === "string" ? msg.method : "";

  if (method === "initialize") {
    return jsonRpcResult(id, {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: {} },
      serverInfo: SERVER_INFO,
      instructions:
        "Jules MCP for DR DHL Elite Fitness Club. Repository and branch are fixed. Use start_jules_task, then poll get_jules_task / get_jules_activities.",
    });
  }

  if (method === "notifications/initialized" || method === "notifications/cancelled") {
    return new Response(null, { status: 202 });
  }

  if (method === "ping") {
    return jsonRpcResult(id, {});
  }

  if (method === "tools/list") {
    return jsonRpcResult(id, { tools: TOOLS });
  }

  if (method === "tools/call") {
    const params = (msg.params ?? {}) as Record<string, unknown>;
    const name = typeof params.name === "string" ? params.name : "";
    const args =
      typeof params.arguments === "object" && params.arguments !== null
        ? (params.arguments as Record<string, unknown>)
        : {};
    try {
      const data = await callTool(name, args);
      return jsonRpcResult(id, toolResultContent(data));
    } catch (e) {
      const message = e instanceof Error ? e.message : "tool error";
      // MCP tool error shape (isError) rather than protocol error when possible
      return jsonRpcResult(id, {
        content: [{ type: "text", text: redactSecrets(message) }],
        isError: true,
      });
    }
  }

  return jsonRpcError(id, -32601, `Method not found: ${method}`);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  // Fail closed if secrets missing (auth + Jules)
  try {
    if (!Deno.env.get("MCP_SHARED_SECRET") || !Deno.env.get("JULES_API_KEY")) {
      return httpError("server misconfigured", 503);
    }
  } catch {
    return httpError("server misconfigured", 503);
  }

  if (!authenticate(req)) {
    return httpError("unauthorized", 401);
  }

  if (req.method === "GET") {
    // Streamable HTTP may use GET for SSE; this server is request/response only.
    return httpError("SSE not offered; use POST JSON-RPC", 405);
  }

  if (req.method !== "POST") {
    return httpError("method not allowed", 405);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return httpError("invalid JSON", 400);
  }

  try {
    if (Array.isArray(body)) {
      // Batch: process sequentially
      const results = [];
      for (const item of body) {
        if (typeof item !== "object" || item === null) continue;
        const res = await handleJsonRpc(item as Record<string, unknown>);
        if (res.status === 202) continue;
        results.push(await res.json());
      }
      return new Response(JSON.stringify(results), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }
    if (typeof body === "object" && body !== null) {
      return await handleJsonRpc(body as Record<string, unknown>);
    }
    return httpError("invalid JSON-RPC body", 400);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "internal error";
    console.error("unhandled", redactSecrets(msg));
    return httpError("internal error", 500);
  }
});
