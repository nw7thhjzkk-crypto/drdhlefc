"use server";

import { createClient } from "@/utils/supabase/server";
import {
  formatLeadNotes,
  validateWebsiteLead,
  type FieldErrors,
  type WebsiteLeadInput,
} from "@/lib/website-lead";

export type SubmitLeadResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

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

  if (parsed.spam) {
    return { ok: true };
  }

  const supabase = await createClient();
  const { data: rpcData, error } = await supabase.rpc("submit_website_lead", {
    p_name: parsed.data.name,
    p_phone: parsed.data.phone,
    p_email: parsed.data.email ?? "",
    p_goal: parsed.data.goal,
    p_interest: parsed.data.interest,
    p_message: parsed.data.message ?? "",
  });

  if (error) {
    const message = error.message ?? "";
    if (message.includes("rate_limited")) {
      return {
        ok: false,
        error: "Please wait a few minutes before sending another enquiry.",
      };
    }
    if (message.includes("invalid_phone")) {
      return {
        ok: false,
        error: "Enter a valid 10-digit Indian mobile number.",
        fieldErrors: { phone: "Enter a valid 10-digit Indian mobile number." },
      };
    }
    if (message.includes("invalid_name")) {
      return {
        ok: false,
        error: "Please enter your name.",
        fieldErrors: { name: "Please enter your name." },
      };
    }
    if (message.includes("invalid_email")) {
      return {
        ok: false,
        error: "Enter a valid email address.",
        fieldErrors: { email: "Enter a valid email address." },
      };
    }
    if (
      message.includes("Could not find the function") ||
      message.includes("schema cache")
    ) {
      return insertViaAuthenticatedFallback(parsed.data);
    }
    console.error("submit_website_lead failed:", error.message);
    return {
      ok: false,
      error: "We could not receive your enquiry. Please try again, or email us.",
    };
  }

  if (!rpcData) {
    return {
      ok: false,
      error: "We could not receive your enquiry. Please try again, or email us.",
    };
  }

  return { ok: true };
}

/**
 * Last-resort path if the RPC has not been applied yet.
 * Still forces source/stage server-side. Will fail closed under RLS for anon
 * (never a fake success).
 */
async function insertViaAuthenticatedFallback(
  data: import("@/lib/website-lead").NormalizedLead
): Promise<SubmitLeadResult> {
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
    return {
      ok: false,
      error: "We could not receive your enquiry. Please try again, or email us.",
    };
  }

  return { ok: true };
}
