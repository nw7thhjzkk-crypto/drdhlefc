"use server";

import { createClient } from "@/utils/supabase/server";
import {
  formatLeadNotes,
  mapSubmitLeadError,
  validateWebsiteLead,
  type FieldErrors,
  type NormalizedLead,
  type WebsiteLeadInput,
} from "@/lib/website-lead";

export type SubmitLeadResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

const GENERIC_ERROR =
  "We could not receive your enquiry. Please try again, or email us.";

export async function submitWebsiteLead(
  input: WebsiteLeadInput
): Promise<SubmitLeadResult> {
  const parsed = validateWebsiteLead(input);

  if (!parsed.ok) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  // Honeypot filled → pretend success, write nothing.
  if (parsed.spam) {
    return { ok: true };
  }


  let rpcData: unknown;
  let rpcError: { message?: string } | null = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("submit_website_lead", {
      p_name: parsed.data.name,
      p_phone: parsed.data.phone,
      p_email: parsed.data.email ?? "",
      p_goal: parsed.data.goal,
      p_interest: parsed.data.interest,
      p_message: parsed.data.message ?? "",
    });
    rpcData = data;
    rpcError = error;
  } catch (err) {
    // Includes missing/invalid Supabase env, network failures, etc.
    console.error("submit_website_lead failed:", err);
    return { ok: false, error: GENERIC_ERROR };
  }

  if (rpcError) {
    const mapped = mapSubmitLeadError(rpcError.message ?? "");
    if (mapped.kind === "fallback") {
      return insertViaAuthenticatedFallback(parsed.data);
    }
    console.error("submit_website_lead failed:", rpcError.message);
    return { ok: false, error: mapped.error, fieldErrors: mapped.fieldErrors };
  }

  if (!rpcData) {
    return { ok: false, error: GENERIC_ERROR };
  }

  return { ok: true };
}

/**
 * Last-resort path if the RPC has not been applied yet.
 * Still forces source/stage server-side. Will fail closed under RLS for anon
 * (never a fake success).
 */
async function insertViaAuthenticatedFallback(
  data: NormalizedLead
): Promise<SubmitLeadResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("leads").insert({
      name: data.name,
      phone: data.phone,
      email: data.email,
      source: "Website",
      language: "en",
      stage: "new",
      notes: formatLeadNotes(data),
    });

    if (error) {
      console.error("website lead fallback insert failed:", error.message);
      return { ok: false, error: GENERIC_ERROR };
    }

    return { ok: true };
  } catch (err) {
    console.error("website lead fallback insert failed:", err);
    return { ok: false, error: GENERIC_ERROR };
  }
}
