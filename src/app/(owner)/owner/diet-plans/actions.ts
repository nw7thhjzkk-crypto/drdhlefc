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


export async function createDietPlan(formData: FormData) {
  const { supabase, user } = await requireOwner();

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

  try {
    await supabase.rpc("insert_audit_log", {
      p_action: "CREATE_DIET_PLAN",
      p_entity_type: "diet_plan",
      p_entity_id: data.id,
      p_member_id: null,
      p_details: { name },
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }

  revalidatePath("/owner/diet-plans");
}

export async function softDeleteDietPlan(id: string) {
  const { supabase } = await requireOwner();

  const { error } = await supabase
    .from("diet_plans")
    .update({ status: "archived" })
    .eq("id", id);

  if (error) throw new Error(error.message);

  try {
    await supabase.rpc("insert_audit_log", {
      p_action: "ARCHIVE_DIET_PLAN",
      p_entity_type: "diet_plan",
      p_entity_id: id,
      p_member_id: null,
      p_details: null,
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }

  revalidatePath("/owner/diet-plans");
}

export async function assignDietPlan(formData: FormData) {
  const { supabase, user } = await requireOwner();

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

  try {
    await supabase.rpc("insert_audit_log", {
      p_action: "ASSIGN_DIET_PLAN",
      p_entity_type: "diet_plan",
      p_entity_id: diet_plan_id,
      p_member_id: member_id,
      p_details: null,
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }

  revalidatePath("/owner/diet-plans");
}

export async function updateDietPlan(id: string, formData: FormData) {
  const { supabase } = await requireOwner();

  const { data: existingPlan, error: fetchError } = await supabase
    .from("diet_plans")
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

export async function seedDietPlans() {
  const { supabase, user } = await requireOwner();

  const starterPlans = [
    {
      name: "Starter Weight Loss",
      goal: "Weight Loss",
      target_calories: 1800,
      protein_g: 150,
      carbs_g: 150,
      fat_g: 60,
      duration_days: 30,
      instructions: "Focus on hydration and lean proteins.",
      content: { meals: ["Oatmeal", "Chicken Salad", "Salmon & Veggies"] },
      source: "owner",
      created_by: user.id,
      status: "active"
    },
    {
      name: "Starter Muscle Gain",
      goal: "Muscle Gain",
      target_calories: 2800,
      protein_g: 200,
      carbs_g: 300,
      fat_g: 80,
      duration_days: 60,
      instructions: "Eat consistently every 3-4 hours.",
      content: { meals: ["Eggs & Toast", "Chicken Rice Bowl", "Steak & Potatoes", "Protein Shake"] },
      source: "owner",
      created_by: user.id,
      status: "active"
    }
  ];

  for (const plan of starterPlans) {
    // Basic idempotency check by name
    const { data: existing } = await supabase
      .from("diet_plans")
      .select("id")
      .eq("name", plan.name)
      .eq("created_by", user.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from("diet_plans").insert(plan);
    }
  }

  try {
    await supabase.rpc("insert_audit_log", {
      p_action: "SEED_DIET_PLANS",
      p_entity_type: "diet_plan",
      p_entity_id: null,
      p_member_id: null,
      p_details: null,
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }

  revalidatePath("/owner/diet-plans");
}
