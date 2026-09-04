"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createWorkoutPlan(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const name = formData.get("name") as string;
  const goal = formData.get("goal") as string;
  const duration_days = parseInt(formData.get("duration_days") as string, 10);
  const instructions = formData.get("instructions") as string;

  const contentStr = formData.get("content") as string;
  const content = contentStr ? JSON.parse(contentStr) : { exercises: [] };

  const { error, data } = await supabase.from("workout_plans").insert({
    name,
    goal,
    duration_days,
    instructions,
    content,
    source: "owner",
    created_by: user.id,
    status: "active"
  }).select().single();

  if (error) throw new Error(error.message);

  await supabase.rpc("insert_audit_log", {
    p_action: "CREATE_WORKOUT_PLAN",
    p_entity_type: "workout_plan",
    p_entity_id: data.id,
    p_member_id: null,
    p_details: { name },
  });

  revalidatePath("/owner/workout-plans");
}

export async function softDeleteWorkoutPlan(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("workout_plans")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await supabase.rpc("insert_audit_log", {
    p_action: "ARCHIVE_WORKOUT_PLAN",
    p_entity_type: "workout_plan",
    p_entity_id: id,
    p_member_id: null,
    p_details: null,
  });

  revalidatePath("/owner/workout-plans");
}

export async function assignWorkoutPlan(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const member_id = formData.get("member_id") as string;
  const workout_plan_id = formData.get("workout_plan_id") as string;

  const { error } = await supabase.from("member_workout_plans").insert({
    member_id,
    workout_plan_id,
    assigned_by: user.id,
    is_recommendation: true,
    status: "pending"
  });

  if (error) throw new Error(error.message);

  await supabase.rpc("insert_audit_log", {
    p_action: "ASSIGN_WORKOUT_PLAN",
    p_entity_type: "workout_plan",
    p_entity_id: workout_plan_id,
    p_member_id: member_id,
    p_details: null,
  });

  revalidatePath("/owner/workout-plans");
}
