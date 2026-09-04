"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Add a body assessment for a member.
 *
 * Security:
 * - Trainer identity derived from auth.uid() — never from FormData.
 * - member_id comes from the URL param passed by the server page, but we
 *   also verify the member is currently assigned to this trainer before
 *   inserting, so even if a bad actor crafts a call with a wrong member_id,
 *   the assignment check will reject it.
 * - Audit written via insert_audit_log() RPC (actor_profile_id = auth.uid()
 *   inside the function).
 */
export async function addAssessment(memberId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) throw new Error("Not authenticated");

  // 1. Resolve trainer from auth.uid()
  const { data: trainer, error: trainerErr } = await supabase
    .from("trainers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (trainerErr || !trainer) throw new Error("Trainer profile not found");

  // 2. Verify the target member is currently assigned to this trainer
  const { data: assignment } = await supabase
    .from("member_trainers")
    .select("id")
    .eq("member_id", memberId)
    .eq("trainer_id", trainer.id)
    .is("unassigned_at", null)
    .maybeSingle();

  if (!assignment) {
    throw new Error("Member is not currently assigned to you — cannot add assessment");
  }

  // 3. Parse and calculate fields
  const height_cm    = parseFloat(formData.get("height_cm")    as string);
  const weight_kg    = parseFloat(formData.get("weight_kg")    as string);
  const body_fat_pct = formData.get("body_fat_pct")
    ? parseFloat(formData.get("body_fat_pct") as string)
    : null;
  const notes = formData.get("notes") as string;

  let bmi: number | null = null;
  if (height_cm > 0 && weight_kg > 0) {
    const height_m = height_cm / 100;
    bmi = parseFloat((weight_kg / (height_m * height_m)).toFixed(1));
  }

  // 4. Insert assessment — recorded_by is server-derived from getUser()
  const { data: assessment, error: insertError } = await supabase
    .from("assessments")
    .insert({
      member_id:   memberId,
      recorded_by: user.id,   // server-verified identity
      source:      "manual",
      height_cm,
      weight_kg,
      bmi,
      body_fat_pct,
      notes,
    })
    .select("id")
    .single();

  if (insertError) throw new Error(insertError.message);

  // 5. Audit via SECURITY DEFINER RPC
  await supabase.rpc("insert_audit_log", {
    p_action:      "ADD_ASSESSMENT",
    p_entity_type: "assessment",
    p_entity_id:   assessment.id,
    p_member_id:   memberId,
    p_details:     { height_cm, weight_kg, bmi, body_fat_pct },
  });

  revalidatePath(`/trainer/members/${memberId}`);
}
