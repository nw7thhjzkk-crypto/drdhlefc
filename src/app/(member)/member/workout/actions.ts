"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function acceptWorkoutPlan(id: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) throw new Error("Not authenticated");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "member") {
    throw new Error("Unauthorized");
  }

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!member) throw new Error("Member not found");

  const { error } = await supabase
    .from("member_workout_plans")
    .update({
      status: "accepted",
      added_to_routine_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("member_id", member.id)
    .eq("status", "pending");

  if (error) throw new Error(error.message);

  await Promise.resolve(
    supabase.rpc("insert_audit_log", {
      p_action: "ACCEPT_WORKOUT_RECOMMENDATION",
      p_entity_type: "member_workout_plan",
      p_entity_id: id,
      p_member_id: member.id,
      p_details: null,
    })
  ).catch((err) => {
    console.error("Failed to insert audit log:", err);
  });

  revalidatePath("/member/workout");
}

export async function declineWorkoutPlan(id: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) throw new Error("Not authenticated");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "member") {
    throw new Error("Unauthorized");
  }

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!member) throw new Error("Member not found");

  const { error } = await supabase
    .from("member_workout_plans")
    .update({ status: "declined" })
    .eq("id", id)
    .eq("member_id", member.id)
    .eq("status", "pending");

  if (error) throw new Error(error.message);

  await Promise.resolve(
    supabase.rpc("insert_audit_log", {
      p_action: "DECLINE_WORKOUT_RECOMMENDATION",
      p_entity_type: "member_workout_plan",
      p_entity_id: id,
      p_member_id: member.id,
      p_details: null,
    })
  ).catch((err) => {
    console.error("Failed to insert audit log:", err);
  });

  revalidatePath("/member/workout");
}
