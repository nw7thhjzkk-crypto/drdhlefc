"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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
