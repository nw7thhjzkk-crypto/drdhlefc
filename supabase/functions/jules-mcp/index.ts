/**
 * Jules MCP Server (Phase 1) — official MCP SDK on Supabase Edge
 *
 * Implementation (Supabase BYO MCP docs):
 *   npm:@modelcontextprotocol/sdk@1.25.3
 *   WebStandardStreamableHTTPServerTransport
 *   Hono request router
 *
 * Auth (Grok / xAI Remote MCP):
 *   Authorization: Bearer <MCP_SHARED_SECRET>
 *
 * Secrets (env only): MCP_SHARED_SECRET, JULES_API_KEY,
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { McpServer } from "npm:@modelcontextprotocol/sdk@1.25.3/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "npm:@modelcontextprotocol/sdk@1.25.3/server/webStandardStreamableHttp.js";
import { Hono } from "npm:hono@^4.9.7";
import { z } from "npm:zod@^3.24.2";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const FIXED_REPO = "nw7thhjzkk-crypto/drdhlefc";
const FIXED_BRANCH = "scaffold-gymsmart-erp-9743545895368865022";
const JULES_SOURCE = "sources/github/nw7thhjzkk-crypto/drdhlefc";
const JULES_API_BASE = "https://jules.googleapis.com/v1alpha";

const MAX_TITLE = 200;
const MAX_PROMPT = 50_000;
const MAX_IDEM = 128;
const MAX_MESSAGE = 20_000;
const MAX_CREATES_PER_HOUR = 20;
const MAX_MESSAGES_PER_HOUR = 60;

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aa = enc.encode(a);
  const bb = enc.encode(b);
  // Single constant-time path: length mismatch folds into the accumulator
  // instead of an early return, so unequal-length inputs do comparable work.
  let diff = aa.length ^ bb.length;
  const n = Math.max(aa.length, bb.length);
  for (let i = 0; i < n; i++) diff |= (aa[i] ?? 0) ^ (bb[i] ?? 0);
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
  return createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
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

function textResult(data: unknown, isError = false) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    ...(isError ? { isError: true } : {}),
  };
}

async function startJulesTask(input: {
  title: string;
  prompt: string;
  idempotency_key?: string;
}) {
  const title = input.title.trim();
  const prompt = input.prompt.trim();
  const idem = (input.idempotency_key?.trim() || crypto.randomUUID()).slice(
    0,
    MAX_IDEM,
  );

  if (!title || title.length > MAX_TITLE) {
    throw new Error(`title required (1-${MAX_TITLE} chars)`);
  }
  if (!prompt || prompt.length > MAX_PROMPT) {
    throw new Error(`prompt required (1-${MAX_PROMPT} chars)`);
  }
  if (!/^[A-Za-z0-9._:-]+$/.test(idem)) {
    throw new Error("invalid idempotency_key");
  }

  const sb = supabaseAdmin();
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count, error: rlErr } = await sb
    .from("jules_orchestration_requests")
    .select("request_id", { count: "exact", head: true })
    .gte("created_at", since);
  if (rlErr) throw new Error("rate limit check failed");
  if ((count ?? 0) >= MAX_CREATES_PER_HOUR) {
    throw new Error("rate limit exceeded");
  }

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
        ? String(session.name).replace(/^sessions\//, "")
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

function createJulesMcpServer(): McpServer {
  const server = new McpServer({
    name: "drdhlefc-jules-mcp",
    version: "1.1.0",
  });

  server.registerTool(
    "start_jules_task",
    {
      title: "Start Jules task",
      description:
        "Start a Jules coding session on nw7thhjzkk-crypto/drdhlefc (fixed production branch, AUTO_CREATE_PR). Repository and branch cannot be overridden.",
      inputSchema: {
        title: z.string().min(1).max(MAX_TITLE),
        prompt: z.string().min(1).max(MAX_PROMPT),
        idempotency_key: z.string().min(1).max(MAX_IDEM).optional(),
      },
    },
    async ({ title, prompt, idempotency_key }) => {
      try {
        const data = await startJulesTask({ title, prompt, idempotency_key });
        return textResult(data);
      } catch (e) {
        const message = e instanceof Error ? e.message : "tool error";
        return textResult({ ok: false, error: redactSecrets(message) }, true);
      }
    },
  );

  server.registerTool(
    "get_jules_task",
    {
      title: "Get Jules task",
      description: "Get safe status/metadata for a Jules session by session_id.",
      inputSchema: {
        session_id: z.string().min(6).max(128),
      },
    },
    async ({ session_id }) => {
      try {
        if (!isSafeSessionId(session_id)) {
          throw new Error("invalid session_id");
        }
        const session = await julesFetch(`/sessions/${session_id}`);
        return textResult({
          ok: true,
          session: {
            id: session.id ?? null,
            name: session.name ?? null,
            title: session.title ?? null,
            state: session.state ?? null,
            url: session.url ?? null,
            createTime: session.createTime ?? null,
            updateTime: session.updateTime ?? null,
            outputs: session.outputs ?? null,
          },
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : "tool error";
        return textResult({ ok: false, error: redactSecrets(message) }, true);
      }
    },
  );

  server.registerTool(
    "get_jules_activities",
    {
      title: "Get Jules activities",
      description: "List Jules activity/progress events for a session.",
      inputSchema: {
        session_id: z.string().min(6).max(128),
      },
    },
    async ({ session_id }) => {
      try {
        if (!isSafeSessionId(session_id)) {
          throw new Error("invalid session_id");
        }
        const payload = await julesFetch(
          `/sessions/${session_id}/activities?pageSize=50`,
        );
        const acts = Array.isArray(payload.activities)
          ? payload.activities
          : [];
        return textResult({
          ok: true,
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
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : "tool error";
        return textResult({ ok: false, error: redactSecrets(message) }, true);
      }
    },
  );

  server.registerTool(
    "message_jules_task",
    {
      title: "Message Jules task",
      description: "Send a follow-up message to an existing Jules session.",
      inputSchema: {
        session_id: z.string().min(6).max(128),
        message: z.string().min(1).max(MAX_MESSAGE),
      },
    },
    async ({ session_id, message }) => {
      try {
        if (!isSafeSessionId(session_id)) {
          throw new Error("invalid session_id");
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

        await julesFetch(`/sessions/${session_id}:sendMessage`, {
          method: "POST",
          body: JSON.stringify({ prompt: message }),
        });

        await sb
          .from("jules_orchestration_requests")
          .update({
            status: "message_sent",
            updated_at: new Date().toISOString(),
          })
          .eq("jules_session_id", session_id);

        return textResult({
          ok: true,
          session_id,
          status: "message_sent",
        });
      } catch (e) {
        const messageText = e instanceof Error ? e.message : "tool error";
        return textResult(
          { ok: false, error: redactSecrets(messageText) },
          true,
        );
      }
    },
  );

  return server;
}

const app = new Hono();

app.get("/health", (c) => {
  if (!authenticate(c.req.raw)) {
    return c.json({ error: "unauthorized" }, 401);
  }
  return c.json({
    ok: true,
    service: "jules-mcp",
    mcp: "@modelcontextprotocol/sdk@1.25.3",
    transport: "WebStandardStreamableHTTPServerTransport",
    repository: FIXED_REPO,
    production_branch: FIXED_BRANCH,
  });
});

app.all("*", async (c) => {
  if (!Deno.env.get("MCP_SHARED_SECRET") || !Deno.env.get("JULES_API_KEY")) {
    return c.json({ error: "server misconfigured" }, 503);
  }
  if (!authenticate(c.req.raw)) {
    return c.json({ error: "unauthorized" }, 401);
  }

  // Per Supabase BYO MCP docs: fresh transport + connect per request
  const server = createJulesMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport();
  await server.connect(transport);
  return transport.handleRequest(c.req.raw);
});

Deno.serve(app.fetch);
