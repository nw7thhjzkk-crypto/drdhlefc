"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createPlan(formData: FormData) {
  const supabase = await createClient();

  // getUser() performs server-side JWT verification (not a local cookie read)
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) return { error: "Not authenticated" };

  const name         = formData.get("name")         as string;
  const duration_days = parseInt(formData.get("duration_days") as string);
  const price        = parseFloat(formData.get("price")        as string);
  const plan_type    = formData.get("plan_type")    as string;
  const description  = formData.get("description")  as string;

  const { data, error } = await supabase
    .from("membership_plans")
    .insert({
      name,
      duration_days,
      price,
      plan_type,
      description,
      status: "active",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Audit via SECURITY DEFINER RPC — actor_profile_id is set to auth.uid()
  // inside the function; it cannot be spoofed by this caller.
  await supabase.rpc("insert_audit_log", {
    p_action:      "CREATE_PLAN",
    p_entity_type: "membership_plan",
    p_entity_id:   data.id,
    p_member_id:   null,
    p_details:     { name, price },
  });

  revalidatePath("/owner/plans");
  return { success: true };
}

export async function updatePlan(id: string, formData: FormData) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) return { error: "Not authenticated" };

  const name         = formData.get("name")         as string;
  const duration_days = parseInt(formData.get("duration_days") as string);
  const price        = parseFloat(formData.get("price")        as string);
  const plan_type    = formData.get("plan_type")    as string;
  const description  = formData.get("description")  as string;
  const status       = formData.get("status")       as string;

  const { error } = await supabase
    .from("membership_plans")
    .update({ name, duration_days, price, plan_type, description, status })
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.rpc("insert_audit_log", {
    p_action:      "UPDATE_PLAN",
    p_entity_type: "membership_plan",
    p_entity_id:   id,
    p_member_id:   null,
    p_details:     { name, status },
  });

  revalidatePath("/owner/plans");
  return { success: true };
}
