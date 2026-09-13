"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; error: string };

export type UpdateProfileResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Member self-edit for safe fields only.
 * Identity is always derived from auth.uid() → members.profile_id.
 */
export async function updateMemberProfile(
  _prev: UpdateProfileResult | null,
  formData: FormData,
): Promise<UpdateProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const phone = String(formData.get("phone") ?? "").trim();
  const primaryGoal = String(formData.get("primary_goal") ?? "").trim();
  const secondaryGoal = String(formData.get("secondary_goal") ?? "").trim();
  const dietPreference = String(formData.get("diet_preference") ?? "").trim();
  const emergencyContactName = String(
    formData.get("emergency_contact_name") ?? "",
  ).trim();
  const emergencyContactPhone = String(
    formData.get("emergency_contact_phone") ?? "",
  ).trim();

  if (phone.length > 32) {
    return { ok: false, error: "Phone is too long" };
  }
  if (primaryGoal.length > 200 || secondaryGoal.length > 200) {
    return { ok: false, error: "Goal text is too long" };
  }

  const { data: member, error: memberErr } = await supabase
    .from("members")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (memberErr || !member) {
    return { ok: false, error: "Member profile not found" };
  }

  const { error } = await supabase
    .from("members")
    .update({
      phone: phone || null,
      primary_goal: primaryGoal || null,
      secondary_goal: secondaryGoal || null,
      diet_preference: dietPreference || null,
      emergency_contact_name: emergencyContactName || null,
      emergency_contact_phone: emergencyContactPhone || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", member.id)
    .eq("profile_id", user.id);

  if (error) return { ok: false, error: error.message };

  // Soft-fail audit — never block the member update
  try {
    await supabase.rpc("insert_audit_log", {
      p_action: "MEMBER_SELF_UPDATE_PROFILE",
      p_entity_type: "member",
      p_entity_id: member.id,
      p_member_id: member.id,
      p_details: {
        fields: [
          "phone",
          "primary_goal",
          "secondary_goal",
          "diet_preference",
          "emergency_contact_name",
          "emergency_contact_phone",
        ],
      },
    });
  } catch {
    /* ignore */
  }

  revalidatePath("/member/profile");
  revalidatePath("/member/home");
  return { ok: true };
}

export async function changePassword(
  _prev: ChangePasswordResult | null,
  formData: FormData,
): Promise<ChangePasswordResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const currentPassword = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!currentPassword) {
    return { ok: false, error: "Current password is required" };
  }
  if (!newPassword) {
    return { ok: false, error: "New password is required" };
  }
  if (newPassword !== confirmPassword) {
    return { ok: false, error: "New passwords do not match" };
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

  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });
  if (signInErr) {
    return { ok: false, error: "Current password is incorrect" };
  }

  const { error: updateErr } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (updateErr) {
    return { ok: false, error: updateErr.message };
  }

  try {
    await supabase.rpc("insert_audit_log", {
      p_action: "MEMBER_SELF_CHANGE_PASSWORD",
      p_entity_type: "member",
      p_entity_id: user.id,
      p_details: {},
    });
  } catch {
    /* ignore */
  }

  return { ok: true };
}
