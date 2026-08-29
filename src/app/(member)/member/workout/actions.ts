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
        added_to_routine_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    console.error("Error accepting workout plan:", error);
    throw new Error(error.message);
  }

  await supabase.from("audit_logs").insert({
    actor_profile_id: user.id,
    action: "ACCEPT_RECOMMENDATION",
    entity_type: "member_workout_plan",
    entity_id: id
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

  await supabase.from("audit_logs").insert({
    actor_profile_id: user.id,
    action: "DECLINE_RECOMMENDATION",
    entity_type: "member_workout_plan",
    entity_id: id
  });

  revalidatePath("/member/workout");
}
