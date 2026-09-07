"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createDietPlan(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const name = formData.get("name") as string;
  const goal = formData.get("goal") as string;
  const target_calories = parseFloat(formData.get("target_calories") as string);
  const protein_g = parseFloat(formData.get("protein_g") as string);
  const carbs_g = parseFloat(formData.get("carbs_g") as string);
  const fat_g = parseFloat(formData.get("fat_g") as string);
  const duration_days = parseInt(formData.get("duration_days") as string, 10);
  const instructions = formData.get("instructions") as string;

  const contentStr = formData.get("content") as string;
  const content = contentStr ? JSON.parse(contentStr) : { meals: [] };

  const { error, data } = await supabase.from("diet_plans").insert({
    name,
    goal,
    target_calories,
    protein_g,
    carbs_g,
    fat_g,
    duration_days,
    instructions,
    content,
    source: "owner",
    created_by: user.id,
    status: "active"
  }).select().single();

  if (error) throw new Error(error.message);

  await supabase.rpc("insert_audit_log", {
    p_action: "CREATE_DIET_PLAN",
    p_entity_type: "diet_plan",
    p_entity_id: data.id,
    p_member_id: null,
    p_details: { name },
  });

  revalidatePath("/owner/diet-plans");
}

export async function softDeleteDietPlan(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("diet_plans")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await supabase.rpc("insert_audit_log", {
    p_action: "ARCHIVE_DIET_PLAN",
    p_entity_type: "diet_plan",
    p_entity_id: id,
    p_member_id: null,
    p_details: null,
  });

  revalidatePath("/owner/diet-plans");
}

export async function assignDietPlan(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const member_id = formData.get("member_id") as string;
  const diet_plan_id = formData.get("diet_plan_id") as string;

  const { error } = await supabase.from("member_diet_plans").insert({
    member_id,
    diet_plan_id,
    assigned_by: user.id,
    is_recommendation: true,
    status: "pending"
  });

  if (error) throw new Error(error.message);

  await supabase.rpc("insert_audit_log", {
    p_action: "ASSIGN_DIET_PLAN",
    p_entity_type: "diet_plan",
    p_entity_id: diet_plan_id,
    p_member_id: member_id,
    p_details: null,
  });

  revalidatePath("/owner/diet-plans");
}

export async function updateDietPlan(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") {
    throw new Error("Unauthorized");
  }

  const { data: existingPlan, error: fetchError } = await supabase
    .from("diet_plans")
    .select("deleted_at")
    .eq("id", id)
    .single();

  if (fetchError || !existingPlan) {
    throw new Error(fetchError?.message || "Plan not found");
  }
  if (existingPlan.deleted_at !== null) {
    throw new Error("Cannot edit a deleted plan");
  }

  const name = formData.get("name") as string;
  const goal = formData.get("goal") as string;
  const target_calories = parseFloat(formData.get("target_calories") as string);
  const protein_g = parseFloat(formData.get("protein_g") as string);
  const carbs_g = parseFloat(formData.get("carbs_g") as string);
  const fat_g = parseFloat(formData.get("fat_g") as string);
  const duration_days = parseInt(formData.get("duration_days") as string, 10);
  const instructions = formData.get("instructions") as string;

  const contentStr = formData.get("content") as string;
  let content;
  try {
    content = contentStr ? JSON.parse(contentStr) : { meals: [] };
  } catch {
    content = { meals: [] };
  }

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
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  try {
    await supabase.rpc("insert_audit_log", {
      p_action: "UPDATE_DIET_PLAN",
      p_entity_type: "diet_plan",
      p_entity_id: id,
      p_member_id: null,
      p_details: { name, goal, target_calories, duration_days },
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }

  revalidatePath("/owner/diet-plans");
}

export async function seedStarterDietPlans() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") {
    throw new Error("Unauthorized");
  }

  const { count } = await supabase
    .from("diet_plans")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null);

  if (count && count > 0) {
    return;
  }

  const starterPlans = [
    {
      name: "Weight Loss Basic",
      goal: "Weight Loss",
      target_calories: 1800,
      protein_g: 150,
      carbs_g: 150,
      fat_g: 60,
      duration_days: 30,
      instructions: "Focus on whole foods. Drink plenty of water.",
      content: { meals: [{ type: "Breakfast", name: "Oats with protein powder" }] },
      source: "owner",
      created_by: user.id,
      status: "active"
    },
    {
      name: "Muscle Gain Standard",
      goal: "Muscle Gain",
      target_calories: 2800,
      protein_g: 180,
      carbs_g: 350,
      fat_g: 80,
      duration_days: 60,
      instructions: "Eat every 3-4 hours. Prioritize post-workout nutrition.",
      content: { meals: [{ type: "Lunch", name: "Chicken, rice, and broccoli" }] },
      source: "owner",
      created_by: user.id,
      status: "active"
    }
  ];

  const { error, data } = await supabase.from("diet_plans").insert(starterPlans).select();

  if (error) throw new Error(error.message);

  if (data && data.length > 0) {
    for (const plan of data) {
      try {
        await supabase.rpc("insert_audit_log", {
          p_action: "CREATE_DIET_PLAN",
          p_entity_type: "diet_plan",
          p_entity_id: plan.id,
          p_member_id: null,
          p_details: { name: plan.name, method: "seed" },
        });
      } catch (err) {
        console.error("Failed to insert audit log for seed:", err);
      }
    }
  }

  revalidatePath("/owner/diet-plans");
}
