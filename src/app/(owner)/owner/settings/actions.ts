"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveGymSettings(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: roleData } = await supabase.rpc('get_role');
  if (roleData !== 'owner') {
    throw new Error("Forbidden");
  }

  const clubName = formData.get("clubName") as string;
  const supportEmail = formData.get("supportEmail") as string;
  const clubAddress = formData.get("clubAddress") as string;
  const premiumTheme = formData.get("premiumTheme") === "on";
  const geminiAiFeatures = formData.get("geminiAiFeatures") === "on";
  const googleDriveIntegration = formData.get("googleDriveIntegration") === "on";

  // Check if settings exist to do an update vs insert
  const { data: existingSettings } = await supabase
    .from("gym_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  const payload = {
    club_name: clubName,
    support_email: supportEmail,
    club_address: clubAddress,
    premium_theme: premiumTheme,
    gemini_ai_features: geminiAiFeatures,
    google_drive_integration: googleDriveIntegration,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  };

  if (existingSettings) {
    const { error } = await supabase
      .from("gym_settings")
      .update(payload)
      .eq("id", existingSettings.id);

    if (error) {
      console.error("Error updating gym settings:", error);
      throw new Error("Failed to update settings");
    }
  } else {
    const { error } = await supabase
      .from("gym_settings")
      .insert([payload]);

    if (error) {
      console.error("Error inserting gym settings:", error);
      throw new Error("Failed to save settings");
    }
  }

  // Record audit log
  try {
    await supabase.rpc("insert_audit_log", {
      p_action: "UPDATE_SETTINGS",
      p_entity_type: "gym_settings",
      p_entity_id: existingSettings?.id || null,
      p_details: payload
    });
  } catch (e) {
    // soft fail audit log
    console.error("Audit log failed for settings update", e);
  }

  revalidatePath("/owner/settings");
}
