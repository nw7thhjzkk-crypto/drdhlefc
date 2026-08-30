"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveSettings(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const club_name = formData.get("club_name") as string;
  const support_email = formData.get("support_email") as string;
  const club_address = formData.get("club_address") as string;
  const premium_theme = formData.get("premium_theme") === "on";
  const ai_features = formData.get("ai_features") === "on";
  const drive_integration = formData.get("drive_integration") === "on";

  const payload = {
    club_name,
    support_email,
    club_address,
    premium_theme,
    ai_features,
    drive_integration
  };

  const { error } = await supabase.from('gym_settings').upsert({
    setting_key: 'general',
    setting_value: payload
  }, { onConflict: 'setting_key' });

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("audit_logs").insert({
    actor_profile_id: user.id,
    action: "UPDATE_SETTINGS",
    entity_type: "gym_settings",
    details: payload
  });

  revalidatePath("/owner/settings");
}
