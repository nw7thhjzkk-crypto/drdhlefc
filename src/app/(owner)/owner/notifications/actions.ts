"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function sendNotification(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Ensure only owners can send notifications
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") {
    throw new Error("Unauthorized");
  }

  const recipient_profile_id = formData.get("recipient_profile_id") as string;
  const title = formData.get("title") as string;
  const body = formData.get("body") as string;

  if (!recipient_profile_id || !title || !body) {
    throw new Error("Missing required fields");
  }

  const now = new Date().toISOString();

  if (recipient_profile_id === "BROADCAST") {
    // Fetch all active members with a profile
    const { data: activeMembers, error: membersError } = await supabase
      .from("members")
      .select("profile_id")
      .eq("status", "active")
      .not("profile_id", "is", null);

    if (membersError) {
      throw new Error(membersError.message);
    }

    if (!activeMembers || activeMembers.length === 0) {
      throw new Error("No active members to broadcast to");
    }

    const notificationsArray = activeMembers.map((member) => ({
      recipient_profile_id: member.profile_id!,
      title,
      body,
      channel: "in_app",
      created_at: now,
    }));

    const { error: insertError } = await supabase
      .from("notifications")
      .insert(notificationsArray);

    if (insertError) {
      throw new Error(insertError.message);
    }

    try {
      await supabase.rpc("insert_audit_log", {
        p_action: "BROADCAST_NOTIFICATION",
        p_entity_type: "notification",
        p_entity_id: null,
        p_member_id: null,
        p_details: { title, count: notificationsArray.length },
      });
    } catch (err) {
      console.error("Audit log failed:", err);
    }
  } else {
    // Single recipient logic
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        recipient_profile_id,
        title,
        body,
        channel: "in_app",
        created_at: now,
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
  }

  revalidatePath("/owner/notifications");
}
