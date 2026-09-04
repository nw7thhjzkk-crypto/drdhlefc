"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Log attendance for a member.
 *
 * Security:
 * - Trainer identity is derived from auth.uid() via a server-side lookup —
 *   the caller cannot supply or spoof their trainer_id.
 * - The target member is verified to be currently assigned to THIS trainer
 *   before the attendance record is inserted. If the member is not assigned,
 *   the action is rejected.
 * - Audit is written via insert_audit_log() RPC so actor_profile_id is
 *   set at the database level.
 */
export async function logAttendance(formData: FormData) {
  const supabase = await createClient();

  // getUser() performs server-side JWT verification — not just a cookie read
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) throw new Error("Not authenticated");

  // 1. Resolve the trainer record for this authenticated user
  const { data: trainer, error: trainerError } = await supabase
    .from("trainers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (trainerError || !trainer) throw new Error("Trainer profile not found");

  // 2. Get the target member_id from the form — we still need to validate it
  const member_id = formData.get("member_id") as string;
  const notes = formData.get("notes") as string;

  if (!member_id) throw new Error("member_id is required");

  // 3. Verify the target member is CURRENTLY assigned to this trainer.
  //    We join member_trainers -> trainers to confirm the assignment exists
  //    and has not been ended (unassigned_at IS NULL).
  const { data: assignment, error: assignmentError } = await supabase
    .from("member_trainers")
    .select("id")
    .eq("member_id", member_id)
    .eq("trainer_id", trainer.id)
    .is("unassigned_at", null)   // only active (not ended) assignments
    .maybeSingle();

  if (assignmentError) throw new Error(assignmentError.message);

  if (!assignment) {
    throw new Error(
      "Member is not currently assigned to you — cannot log attendance"
    );
  }

  // 4. Insert the attendance record.
  //    trainer_id is sourced from step 1 (server-side), not from FormData.
  const { error: insertError } = await supabase.from("attendance").insert({
    member_id,
    trainer_id: trainer.id,   // server-derived, not caller-supplied
    method: "manual",
    check_in: true,
    notes,
  });

  if (insertError) throw new Error(insertError.message);

  // 5. Write audit via the SECURITY DEFINER RPC (actor_profile_id = auth.uid()
  //    is set inside the function — cannot be spoofed from here).
  await supabase.rpc("insert_audit_log", {
    p_action: "LOG_ATTENDANCE",
    p_entity_type: "attendance",
    p_entity_id: null,
    p_member_id: member_id,
    p_details: { trainer_id: trainer.id },
  });

  revalidatePath("/trainer/attendance");
}
