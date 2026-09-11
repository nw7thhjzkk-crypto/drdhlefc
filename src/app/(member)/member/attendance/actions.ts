"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function logSelfAttendance() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) throw new Error("Not authenticated");

  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (memberError || !member) {
    throw new Error("Member profile not found");
  }

  // Optional same-day guard
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data: existingAttendance } = await supabase
    .from("attendance")
    .select("id")
    .eq("member_id", member.id)
    .gte("occurred_at", todayStart.toISOString())
    .lte("occurred_at", todayEnd.toISOString())
    .limit(1)
    .maybeSingle();

  if (existingAttendance) {
    throw new Error("You have already checked in today");
  }

  const { error: insertError } = await supabase.from("attendance").insert({
    member_id: member.id,
    trainer_id: null,
    method: "manual",
    check_in: true,
  });

  if (insertError) throw new Error(insertError.message);

  // Soft-fail audit
  try {
    await supabase.rpc("insert_audit_log", {
      p_action: "LOG_SELF_ATTENDANCE",
      p_entity_type: "attendance",
      p_entity_id: null,
      p_member_id: member.id,
      p_details: { method: "manual", check_in: true },
    });
  } catch {
    // Ignore RPC result/errors
  }

  revalidatePath("/member/home");
  revalidatePath("/member/attendance");
}
