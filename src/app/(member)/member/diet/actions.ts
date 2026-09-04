"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function acceptDietPlan(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("member_diet_plans")
    .update({
      status: "accepted",
      added_to_routine_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await supabase.rpc("insert_audit_log", {
    p_action: "ACCEPT_DIET_RECOMMENDATION",
    p_entity_type: "member_diet_plan",
    p_entity_id: id,
    p_member_id: null,
    p_details: null,
  });

  revalidatePath("/member/diet");
}

export async function declineDietPlan(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("member_diet_plans")
    .update({ status: "declined" })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await supabase.rpc("insert_audit_log", {
    p_action: "DECLINE_DIET_RECOMMENDATION",
    p_entity_type: "member_diet_plan",
    p_entity_id: id,
    p_member_id: null,
    p_details: null,
  });

  revalidatePath("/member/diet");
}
