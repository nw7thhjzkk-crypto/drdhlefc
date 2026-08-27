"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createPlan(formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Unauthorized" };
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'owner') {
    return { error: "Unauthorized: Insufficient permissions" };
  }
  const userId = user.id;

  const name = formData.get("name") as string;
  const duration_days = parseInt(formData.get("duration_days") as string);
  const price = parseFloat(formData.get("price") as string);
  const plan_type = formData.get("plan_type") as string;
  const description = formData.get("description") as string;

  const { data, error } = await supabase
    .from("membership_plans")
    .insert({
      name,
      duration_days,
      price,
      plan_type,
      description,
      status: "active"
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (userId) {
    await supabase.from("audit_logs").insert({
      actor_profile_id: userId,
      action: "create_plan",
      entity_type: "membership_plan",
      entity_id: data.id,
      details: { name, price }
    });
  }

  revalidatePath("/owner/plans");
  return { success: true };
}

export async function updatePlan(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Unauthorized" };
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'owner') {
    return { error: "Unauthorized: Insufficient permissions" };
  }
  const userId = user.id;

  const name = formData.get("name") as string;
  const duration_days = parseInt(formData.get("duration_days") as string);
  const price = parseFloat(formData.get("price") as string);
  const plan_type = formData.get("plan_type") as string;
  const description = formData.get("description") as string;
  const status = formData.get("status") as string;

  const { error } = await supabase
    .from("membership_plans")
    .update({ name, duration_days, price, plan_type, description, status })
    .eq("id", id);

  if (error) return { error: error.message };

  if (userId) {
    await supabase.from("audit_logs").insert({
      actor_profile_id: userId,
      action: "update_plan",
      entity_type: "membership_plan",
      entity_id: id,
      details: { name, status }
    });
  }

  revalidatePath("/owner/plans");
  return { success: true };
}
