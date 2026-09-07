"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

async function requireOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") {
    throw new Error("Unauthorized");
  }

  return { supabase, user };
}

async function softFailAudit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  args: {
    p_action: string;
    p_entity_type: string;
    p_entity_id: string;
    p_member_id: string | null;
    p_details: Record<string, unknown> | null;
  }
) {
  try {
    await supabase.rpc("insert_audit_log", args);
  } catch (err) {
    console.error("Failed to insert audit log:", err);
  }
}

export async function createActivity(formData: FormData) {
  const { supabase } = await requireOwner();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const trainer_id = formData.get("trainer_id") as string;
  const start_at = formData.get("start_at") as string;
  const duration_minutes = parseInt(formData.get("duration_minutes") as string, 10);
  const location = formData.get("location") as string;
  const capacity = parseInt(formData.get("capacity") as string, 10);

  const { error, data } = await supabase.from("group_activities").insert({
    name,
    description,
    trainer_id: trainer_id || null,
    start_at: new Date(start_at).toISOString(),
    duration_minutes,
    location,
    capacity,
    status: "active"
  }).select().single();

  if (error) throw new Error(error.message);

  await softFailAudit(supabase, {
    p_action: "CREATE_ACTIVITY",
    p_entity_type: "group_activity",
    p_entity_id: data.id,
    p_member_id: null,
    p_details: { name },
  });

  revalidatePath("/owner/activities");
}

export async function cancelActivity(id: string) {
  const { supabase } = await requireOwner();

  const { error } = await supabase
    .from("group_activities")
    .update({ status: "cancelled", deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await softFailAudit(supabase, {
    p_action: "CANCEL_ACTIVITY",
    p_entity_type: "group_activity",
    p_entity_id: id,
    p_member_id: null,
    p_details: null,
  });

  revalidatePath("/owner/activities");
}


export async function updateActivity(id: string, formData: FormData) {
  const { supabase } = await requireOwner();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const trainer_id = formData.get("trainer_id") as string;
  const start_at = formData.get("start_at") as string;
  const duration_minutes = parseInt(formData.get("duration_minutes") as string, 10);
  const location = formData.get("location") as string;
  const capacity = parseInt(formData.get("capacity") as string, 10);

  // Fetch the activity to ensure it exists and is not soft-deleted
  const { data: activity, error: fetchError } = await supabase
    .from("group_activities")
    .select("id, deleted_at")
    .eq("id", id)
    .single();

  if (fetchError || !activity) {
    throw new Error("Activity not found");
  }
  if (activity.deleted_at !== null) {
    throw new Error("Cannot update a cancelled activity");
  }

  const { error } = await supabase
    .from("group_activities")
    .update({
      name,
      description,
      trainer_id: trainer_id || null,
      start_at: new Date(start_at).toISOString(),
      duration_minutes,
      location,
      capacity,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await softFailAudit(supabase, {
    p_action: "UPDATE_ACTIVITY",
    p_entity_type: "group_activity",
    p_entity_id: id,
    p_member_id: null,
    p_details: { name, start_at, duration_minutes, location, capacity },
  });

  revalidatePath("/owner/activities");
}
