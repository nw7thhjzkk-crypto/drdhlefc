"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

async function requireTrainer() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (!user || authError) throw new Error("Not authenticated");

  const { data: trainer, error: trainerError } = await supabase
    .from("trainers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (trainerError || !trainer) throw new Error("Trainer profile not found");

  return { supabase, user, trainer };
}

async function assertAssignedMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  trainerId: string,
  memberId: string
) {
  const { data: assignment, error } = await supabase
    .from("member_trainers")
    .select("id")
    .eq("member_id", memberId)
    .eq("trainer_id", trainerId)
    .is("unassigned_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!assignment) {
    throw new Error("Member is not currently assigned to you — cannot assign plan");
  }
}

async function softAudit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    p_action: string;
    p_entity_type: string;
    p_entity_id: string | null;
    p_member_id: string | null;
    p_details: Record<string, unknown> | null;
  }
) {
  await Promise.resolve(supabase.rpc("insert_audit_log", params)).catch((err) => {
    console.error("Failed to insert audit log:", err);
  });
}

export async function createWorkoutPlan(formData: FormData) {
  const { supabase, user, trainer } = await requireTrainer();

  const name = formData.get("name") as string;
  const goal = formData.get("goal") as string;
  const duration_days = parseInt(formData.get("duration_days") as string, 10);
  const instructions = (formData.get("instructions") as string) || "";

  const contentStr = formData.get("content") as string;
  const content = contentStr ? JSON.parse(contentStr) : { exercises: [] };

  const { error, data } = await supabase
    .from("workout_plans")
    .insert({
      name,
      goal,
      duration_days,
      instructions,
      content,
      source: "trainer",
      created_by: user.id,
      status: "active",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await softAudit(supabase, {
    p_action: "CREATE_WORKOUT_PLAN",
    p_entity_type: "workout_plan",
    p_entity_id: data.id,
    p_member_id: null,
    p_details: { name, trainer_id: trainer.id, source: "trainer" },
  });

  revalidatePath("/trainer/plans");
}

export async function updateWorkoutPlan(planId: string, formData: FormData) {
  const { supabase, user, trainer } = await requireTrainer();

  if (!planId) throw new Error("planId is required");

  const name = formData.get("name") as string;
  const goal = formData.get("goal") as string;
  const duration_days = parseInt(formData.get("duration_days") as string, 10);
  const instructions = (formData.get("instructions") as string) || "";

  const contentStr = formData.get("content") as string;
  const content = contentStr ? JSON.parse(contentStr) : { exercises: [] };

  const { error } = await supabase
    .from("workout_plans")
    .update({
      name,
      goal,
      duration_days,
      instructions,
      content,
    })
    .eq("id", planId)
    .eq("created_by", user.id)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  await softAudit(supabase, {
    p_action: "UPDATE_WORKOUT_PLAN",
    p_entity_type: "workout_plan",
    p_entity_id: planId,
    p_member_id: null,
    p_details: { name, trainer_id: trainer.id },
  });

  revalidatePath("/trainer/plans");
}

export async function createDietPlan(formData: FormData) {
  const { supabase, user, trainer } = await requireTrainer();

  const name = formData.get("name") as string;
  const goal = formData.get("goal") as string;
  const target_calories = parseFloat(formData.get("target_calories") as string);
  const protein_g = parseFloat(formData.get("protein_g") as string);
  const carbs_g = parseFloat(formData.get("carbs_g") as string);
  const fat_g = parseFloat(formData.get("fat_g") as string);
  const duration_days = parseInt(formData.get("duration_days") as string, 10);
  const instructions = (formData.get("instructions") as string) || "";

  const contentStr = formData.get("content") as string;
  const content = contentStr ? JSON.parse(contentStr) : { meals: [] };

  const { error, data } = await supabase
    .from("diet_plans")
    .insert({
      name,
      goal,
      target_calories,
      protein_g,
      carbs_g,
      fat_g,
      duration_days,
      instructions,
      content,
      source: "trainer",
      created_by: user.id,
      status: "active",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await softAudit(supabase, {
    p_action: "CREATE_DIET_PLAN",
    p_entity_type: "diet_plan",
    p_entity_id: data.id,
    p_member_id: null,
    p_details: { name, trainer_id: trainer.id, source: "trainer" },
  });

  revalidatePath("/trainer/plans");
}

export async function updateDietPlan(planId: string, formData: FormData) {
  const { supabase, user, trainer } = await requireTrainer();

  if (!planId) throw new Error("planId is required");

  const name = formData.get("name") as string;
  const goal = formData.get("goal") as string;
  const target_calories = parseFloat(formData.get("target_calories") as string);
  const protein_g = parseFloat(formData.get("protein_g") as string);
  const carbs_g = parseFloat(formData.get("carbs_g") as string);
  const fat_g = parseFloat(formData.get("fat_g") as string);
  const duration_days = parseInt(formData.get("duration_days") as string, 10);
  const instructions = (formData.get("instructions") as string) || "";

  const contentStr = formData.get("content") as string;
  const content = contentStr ? JSON.parse(contentStr) : { meals: [] };

  const { error } = await supabase
    .from("diet_plans")
    .update({
      name,
      goal,
      target_calories,
      protein_g,
      carbs_g,
      fat_g,
      duration_days,
      instructions,
      content,
    })
    .eq("id", planId)
    .eq("created_by", user.id)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  await softAudit(supabase, {
    p_action: "UPDATE_DIET_PLAN",
    p_entity_type: "diet_plan",
    p_entity_id: planId,
    p_member_id: null,
    p_details: { name, trainer_id: trainer.id },
  });

  revalidatePath("/trainer/plans");
}

export async function assignWorkoutPlan(formData: FormData) {
  const { supabase, user, trainer } = await requireTrainer();

  const member_id = formData.get("member_id") as string;
  const workout_plan_id = formData.get("workout_plan_id") as string;
  if (!member_id || !workout_plan_id) {
    throw new Error("member_id and workout_plan_id are required");
  }

  await assertAssignedMember(supabase, trainer.id, member_id);

  // Ensure the plan belongs to this trainer
  const { data: plan, error: planError } = await supabase
    .from("workout_plans")
    .select("id")
    .eq("id", workout_plan_id)
    .eq("created_by", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (planError) throw new Error(planError.message);
  if (!plan) throw new Error("Workout plan not found or not owned by you");

  const { error } = await supabase.from("member_workout_plans").insert({
    member_id,
    workout_plan_id,
    assigned_by: user.id,
    is_recommendation: true,
    status: "pending",
  });

  if (error) throw new Error(error.message);

  await softAudit(supabase, {
    p_action: "ASSIGN_WORKOUT_PLAN",
    p_entity_type: "workout_plan",
    p_entity_id: workout_plan_id,
    p_member_id: member_id,
    p_details: { trainer_id: trainer.id },
  });

  revalidatePath("/trainer/plans");
}

export async function assignDietPlan(formData: FormData) {
  const { supabase, user, trainer } = await requireTrainer();

  const member_id = formData.get("member_id") as string;
  const diet_plan_id = formData.get("diet_plan_id") as string;
  if (!member_id || !diet_plan_id) {
    throw new Error("member_id and diet_plan_id are required");
  }

  await assertAssignedMember(supabase, trainer.id, member_id);

  const { data: plan, error: planError } = await supabase
    .from("diet_plans")
    .select("id")
    .eq("id", diet_plan_id)
    .eq("created_by", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (planError) throw new Error(planError.message);
  if (!plan) throw new Error("Diet plan not found or not owned by you");

  const { error } = await supabase.from("member_diet_plans").insert({
    member_id,
    diet_plan_id,
    assigned_by: user.id,
    is_recommendation: true,
    status: "pending",
  });

  if (error) throw new Error(error.message);

  await softAudit(supabase, {
    p_action: "ASSIGN_DIET_PLAN",
    p_entity_type: "diet_plan",
    p_entity_id: diet_plan_id,
    p_member_id: member_id,
    p_details: { trainer_id: trainer.id },
  });

  revalidatePath("/trainer/plans");
}
