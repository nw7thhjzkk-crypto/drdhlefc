"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveGymSettings(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Double check authorization on the server side
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") {
    throw new Error("Unauthorized");
  }

  const club_name = formData.get("club_name") as string;
  const support_email = formData.get("support_email") as string;
  const club_address = formData.get("club_address") as string;
  const premium_theme = formData.get("premium_theme") === "on";
  const gemini_ai_enabled = formData.get("gemini_ai_enabled") === "on";
  const google_drive_enabled = formData.get("google_drive_enabled") === "on";

  if (!club_name) {
    throw new Error("Club name is required");
  }

  const { error } = await supabase
    .from("gym_settings")
    .upsert({
      id: "00000000-0000-0000-0000-000000000000",
      club_name,
      support_email,
      club_address,
      premium_theme,
      gemini_ai_enabled,
      google_drive_enabled,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    });

  if (error) {
    console.error("Failed to update gym settings:", error);
    throw new Error("Failed to update settings");
  }

  // Soft-fail audit logging — match live insert_audit_log(p_action, p_entity_type, p_entity_id, p_member_id, p_details)
  try {
    await supabase.rpc("insert_audit_log", {
      p_action: "UPDATE_GYM_SETTINGS",
      p_entity_type: "gym_settings",
      p_entity_id: "00000000-0000-0000-0000-000000000000",
      p_member_id: null,
      p_details: {
        club_name,
        support_email,
        club_address,
        premium_theme,
        gemini_ai_enabled,
        google_drive_enabled,
      },
    });
  } catch (err) {
    console.error("Failed to insert audit log:", err);
  }

  revalidatePath("/owner/settings");
}
