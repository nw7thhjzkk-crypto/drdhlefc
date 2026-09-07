"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

async function requireOwner() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) throw new Error("Not authenticated");

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


export async function createWorkoutPlan(formData: FormData) {
  const { supabase, user } = await requireOwner();

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

  try {
    await supabase.rpc("insert_audit_log", {
      p_action: "CREATE_WORKOUT_PLAN",
      p_entity_type: "workout_plan",
      p_entity_id: data.id,
      p_member_id: null,
      p_details: { name },
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }

  revalidatePath("/owner/workout-plans");
}

export async function softDeleteWorkoutPlan(id: string) {
  const { supabase, user } = await requireOwner();

  const { error } = await supabase
    .from("workout_plans")
    .update({ status: "archived" })
    .eq("id", id);

  if (error) throw new Error(error.message);

  try {
    await supabase.rpc("insert_audit_log", {
      p_action: "ARCHIVE_WORKOUT_PLAN",
      p_entity_type: "workout_plan",
      p_entity_id: id,
      p_member_id: null,
      p_details: null,
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }

  revalidatePath("/owner/workout-plans");
}

export async function assignWorkoutPlan(formData: FormData) {
  const { supabase, user } = await requireOwner();

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

  try {
    await supabase.rpc("insert_audit_log", {
      p_action: "ASSIGN_WORKOUT_PLAN",
      p_entity_type: "workout_plan",
      p_entity_id: workout_plan_id,
      p_member_id: member_id,
      p_details: null,
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }

  revalidatePath("/owner/workout-plans");
}

export async function updateWorkoutPlan(id: string, formData: FormData) {
  const { supabase, user } = await requireOwner();

  const { data: existingPlan, error: fetchError } = await supabase
    .from("workout_plans")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError || !existingPlan) {
    throw new Error(fetchError?.message || "Plan not found");
  }
  if (existingPlan.status === "archived") {
    throw new Error("Cannot edit a deleted plan");
  }

  const name = formData.get("name") as string;
  const goal = formData.get("goal") as string;
  const duration_days = parseInt(formData.get("duration_days") as string, 10);
  const instructions = formData.get("instructions") as string;

  const contentStr = formData.get("content") as string;
  let content;
  try {
    content = contentStr ? JSON.parse(contentStr) : { exercises: [] };
  } catch {
    content = { exercises: [] };
  }

  const { error } = await supabase
    .from("workout_plans")
    .update({
      name,
      goal,
      duration_days,
      instructions,
      content,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  try {
    await supabase.rpc("insert_audit_log", {
      p_action: "UPDATE_WORKOUT_PLAN",
      p_entity_type: "workout_plan",
      p_entity_id: id,
      p_member_id: null,
      p_details: { name, goal, duration_days },
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }

  revalidatePath("/owner/workout-plans");
}

export async function seedWorkoutPlans() {
  const { supabase, user } = await requireOwner();

  const starterPlans = [
    {
      name: "Starter Full Body",
      goal: "General Health",
      duration_days: 30,
      instructions: "Perform 3 times a week with a day of rest in between.",
      content: { exercises: [{ name: "Squats", sets: 3, reps: 10 }, { name: "Pushups", sets: 3, reps: 10 }] },
      source: "owner",
      created_by: user.id,
      status: "active"
    },
    {
      name: "Starter Split Routine",
      goal: "Muscle Gain",
      duration_days: 60,
      instructions: "Upper body on Mon/Thu, Lower body on Tue/Fri.",
      content: { exercises: [{ name: "Bench Press", sets: 4, reps: 8 }, { name: "Deadlift", sets: 4, reps: 6 }] },
      source: "owner",
      created_by: user.id,
      status: "active"
    }
  ];

  for (const plan of starterPlans) {
    // Basic idempotency check by name
    const { data: existing } = await supabase
      .from("workout_plans")
      .select("id")
      .eq("name", plan.name)
      .eq("created_by", user.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from("workout_plans").insert(plan);
    }
  }

  try {
    await supabase.rpc("insert_audit_log", {
      p_action: "SEED_WORKOUT_PLANS",
      p_entity_type: "workout_plan",
      p_entity_id: null,
      p_member_id: null,
      p_details: null,
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }

  revalidatePath("/owner/workout-plans");
}
