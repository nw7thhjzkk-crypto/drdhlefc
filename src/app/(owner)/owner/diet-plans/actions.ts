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

  if (error) {
    console.error("Error creating diet plan:", error);
    throw new Error(error.message);
  }

  await supabase.from("audit_logs").insert({
    actor_profile_id: user.id,
    action: "CREATE",
    entity_type: "diet_plan",
    entity_id: data.id,
    details: { name }
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

  await supabase.from("audit_logs").insert({
    actor_profile_id: user.id,
    action: "ARCHIVE",
    entity_type: "diet_plan",
    entity_id: id,
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

    await supabase.from("audit_logs").insert({
        actor_profile_id: user.id,
        action: "ASSIGN",
        entity_type: "diet_plan",
        entity_id: diet_plan_id,
        member_id: member_id
    });

    revalidatePath("/owner/diet-plans");
}
