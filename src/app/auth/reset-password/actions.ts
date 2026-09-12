"use server";

import { createClient } from "@/utils/supabase/server";

export type ResetPasswordResult =
  | { ok: true }
  | { ok: false; error: string };

export async function resetPassword(
  _prev: ResetPasswordResult | null,
  formData: FormData,
): Promise<ResetPasswordResult> {
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!newPassword) {
    return { ok: false, error: "New password is required" };
  }
  if (newPassword !== confirmPassword) {
    return { ok: false, error: "Passwords do not match" };
  }
  if (newPassword.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters" };
  }
  if (!/[A-Z]/.test(newPassword)) {
    return { ok: false, error: "Password must contain an uppercase letter" };
  }
  if (!/[a-z]/.test(newPassword)) {
    return { ok: false, error: "Password must contain a lowercase letter" };
  }
  if (!/[0-9]/.test(newPassword)) {
    return { ok: false, error: "Password must contain at least one number" };
  }

  const supabase = await createClient();

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return { ok: false, error: "Session expired. Please request a new reset link." };
  }

  const { error: updateErr } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateErr) {
    return { ok: false, error: updateErr.message };
  }

  try {
    await supabase.rpc("insert_audit_log", {
      p_action: "MEMBER_PASSWORD_RESET",
      p_entity_type: "member",
      p_entity_id: user.id,
      p_details: {},
    });
  } catch {
    /* ignore — soft-fail audit */
  }

  return { ok: true };
}
