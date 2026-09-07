"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Gym-wide manual attendance log (owner only).
 *
 * Security:
 * - Verifies profiles.role === 'owner' for the authenticated user.
 * - trainer_id is always null (front-desk / owner check-in).
 * - Audit via insert_audit_log soft-fails if the RPC is unavailable.
 */
export async function logAttendance(formData: FormData) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) throw new Error("Not authenticated");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "owner") {
    throw new Error("Owner access required");
  }

  const member_id = formData.get("member_id") as string;
  const notesRaw = formData.get("notes");
  const notes = typeof notesRaw === "string" && notesRaw.trim() !== "" ? notesRaw.trim() : null;

  if (!member_id) throw new Error("member_id is required");

  const { error: insertError } = await supabase.from("attendance").insert({
    member_id,
    trainer_id: null,
    method: "manual",
    check_in: true,
    notes,
  });

  if (insertError) throw new Error(insertError.message);

  // Soft-fail audit — ignore RPC result/errors
  await supabase.rpc("insert_audit_log", {
    p_action: "LOG_ATTENDANCE",
    p_entity_type: "attendance",
    p_entity_id: null,
    p_member_id: member_id,
    p_details: { method: "manual", by: "owner" },
  });

  revalidatePath("/owner/attendance");
}
