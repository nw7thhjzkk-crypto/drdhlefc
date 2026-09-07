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

  const name = (formData.get("name") as string)?.trim();
  const description = ((formData.get("description") as string) || "").trim() || null;
  const trainer_id = (formData.get("trainer_id") as string) || null;
  const start_at = formData.get("start_at") as string;
  const duration_minutes = parseInt(
    formData.get("duration_minutes") as string,
    10
  );
  const location = (formData.get("location") as string)?.trim();
  const capacity = parseInt(formData.get("capacity") as string, 10);

  if (!name) throw new Error("name is required");
  if (!start_at) throw new Error("start_at is required");
  if (!location) throw new Error("location is required");
  if (Number.isNaN(duration_minutes) || duration_minutes < 1) {
    throw new Error("duration_minutes must be a positive integer");
  }
  if (Number.isNaN(capacity) || capacity < 1) {
    throw new Error("capacity must be a positive integer");
  }

  const { error, data } = await supabase
    .from("group_activities")
    .insert({
      name,
      description,
      trainer_id: trainer_id || null,
      start_at: new Date(start_at).toISOString(),
      duration_minutes,
      location,
      capacity,
      status: "active",
    })
    .select("id")
    .single();

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

/**
 * Edit an active scheduled group activity.
 * Live schema has no deleted_at — cancelled rows are status='cancelled'.
 */
export async function updateActivity(activityId: string, formData: FormData) {
  const { supabase } = await requireOwner();

  if (!activityId) throw new Error("activityId is required");

  const { data: existing, error: fetchError } = await supabase
    .from("group_activities")
    .select("id, status")
    .eq("id", activityId)
    .single();

  if (fetchError || !existing) {
    throw new Error(fetchError?.message || "Activity not found");
  }

  if (existing.status === "cancelled") {
    throw new Error("Cannot edit a cancelled activity");
  }

  const name = (formData.get("name") as string)?.trim();
  const description =
    ((formData.get("description") as string) || "").trim() || null;
  const trainerRaw = (formData.get("trainer_id") as string) || "";
  const trainer_id = trainerRaw.trim() ? trainerRaw.trim() : null;
  const start_at = formData.get("start_at") as string;
  const duration_minutes = parseInt(
    formData.get("duration_minutes") as string,
    10
  );
  const location = (formData.get("location") as string)?.trim();
  const capacity = parseInt(formData.get("capacity") as string, 10);

  if (!name) throw new Error("name is required");
  if (!start_at) throw new Error("start_at is required");
  if (!location) throw new Error("location is required");
  if (Number.isNaN(duration_minutes) || duration_minutes < 1) {
    throw new Error("duration_minutes must be a positive integer");
  }
  if (Number.isNaN(capacity) || capacity < 1) {
    throw new Error("capacity must be a positive integer");
  }

  const { error } = await supabase
    .from("group_activities")
    .update({
      name,
      description,
      trainer_id,
      start_at: new Date(start_at).toISOString(),
      duration_minutes,
      location,
      capacity,
    })
    .eq("id", activityId)
    .neq("status", "cancelled");

  if (error) throw new Error(error.message);

  await softFailAudit(supabase, {
    p_action: "UPDATE_ACTIVITY",
    p_entity_type: "group_activity",
    p_entity_id: activityId,
    p_member_id: null,
    p_details: {
      name,
      trainer_id,
      start_at,
      duration_minutes,
      capacity,
      location,
    },
  });

  revalidatePath("/owner/activities");
}

export async function cancelActivity(id: string) {
  const { supabase } = await requireOwner();

  if (!id) throw new Error("id is required");

  // Live group_activities has no deleted_at — soft-cancel via status only.
  const { error } = await supabase
    .from("group_activities")
    .update({ status: "cancelled" })
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
