"use server";

import { createClient } from "@/utils/supabase/server";

export type ForgotPasswordResult =
  | { ok: true }
  | { ok: false; error: string };

export async function requestPasswordReset(
  _prev: ForgotPasswordResult | null,
  formData: FormData,
): Promise<ForgotPasswordResult> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { ok: false, error: "Email is required" };
  }

  const supabase = await createClient();

  const origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset-password`,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
