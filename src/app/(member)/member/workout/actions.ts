"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function acceptWorkoutPlan(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("member_workout_plans")
    .update({
      status: "accepted",
      added_to_routine_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await supabase.rpc("insert_audit_log", {
    p_action: "ACCEPT_WORKOUT_RECOMMENDATION",
    p_entity_type: "member_workout_plan",
    p_entity_id: id,
    p_member_id: null,
    p_details: null,
  });

  revalidatePath("/member/workout");
}

export async function declineWorkoutPlan(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("member_workout_plans")
    .update({ status: "declined" })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await supabase.rpc("insert_audit_log", {
    p_action: "DECLINE_WORKOUT_RECOMMENDATION",
    p_entity_type: "member_workout_plan",
    p_entity_id: id,
    p_member_id: null,
    p_details: null,
  });

  revalidatePath("/member/workout");
}
