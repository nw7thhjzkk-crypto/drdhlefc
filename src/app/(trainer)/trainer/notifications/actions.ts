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


export async function sendNotification(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Ensure only trainers can send notifications
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "trainer") {
    throw new Error("Unauthorized");
  }

  const { data: trainer } = await supabase
    .from("trainers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!trainer) {
    throw new Error("Trainer profile not found");
  }

  const recipient_profile_id = formData.get("recipient_profile_id") as string;
  const title = formData.get("title") as string;
  const body = formData.get("body") as string;

  if (!recipient_profile_id || !title || !body) {
    throw new Error("Missing required fields");
  }

  // Ensure recipient is assigned to this trainer
  const { data: assignment } = await supabase
    .from("member_trainers")
    .select("members!inner(profile_id)")
    .eq("trainer_id", trainer.id)
    .eq("members.profile_id", recipient_profile_id)
    .is("unassigned_at", null)
    .single();

  if (!assignment) {
    throw new Error("Recipient is not assigned to you");
  }

  const { data: notification, error } = await supabase
    .from("notifications")
    .insert({
      recipient_profile_id,
      title,
      body,
      channel: "in_app",
      created_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  try {
    await supabase.rpc("insert_audit_log", {
      p_action: "SEND_NOTIFICATION",
      p_entity_type: "notification",
      p_entity_id: notification.id,
      p_member_id: null,
      p_details: { title, recipient_profile_id },
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }

  revalidatePath("/trainer/notifications");
}
