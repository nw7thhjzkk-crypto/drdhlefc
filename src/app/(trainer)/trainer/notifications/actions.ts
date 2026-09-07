"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function markNotificationRead(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Update notification where recipient is the current user
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("recipient_profile_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  try {
    await supabase.rpc("insert_audit_log", {
      p_action: "MARK_NOTIFICATION_READ",
      p_entity_type: "notification",
      p_entity_id: id,
      p_member_id: null,
      p_details: {},
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }

  revalidatePath("/trainer/notifications");
  revalidatePath("/trainer/dashboard");
}
