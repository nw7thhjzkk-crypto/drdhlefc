"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

function optionalNumber(value: FormDataEntryValue | null): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Create a manual body assessment for an assigned member.
 *
 * Security:
 * - Trainer identity is derived from auth.uid() via trainers.profile_id.
 * - Target member must be currently assigned (unassigned_at IS NULL).
 * - recorded_by is always the authenticated user id.
 * - Audit via insert_audit_log soft-fails if the RPC is unavailable.
 */
export async function createAssessment(formData: FormData) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) throw new Error("Not authenticated");

  const { data: trainer, error: trainerError } = await supabase
    .from("trainers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (trainerError || !trainer) throw new Error("Trainer profile not found");

  const member_id = formData.get("member_id") as string;
  if (!member_id) throw new Error("member_id is required");

  const { data: assignment, error: assignmentError } = await supabase
    .from("member_trainers")
    .select("id")
    .eq("member_id", member_id)
    .eq("trainer_id", trainer.id)
    .is("unassigned_at", null)
    .maybeSingle();

  if (assignmentError) throw new Error(assignmentError.message);
  if (!assignment) {
    throw new Error("Member is not currently assigned to you — cannot create assessment");
  }

  const height_cm = optionalNumber(formData.get("height_cm"));
  const weight_kg = optionalNumber(formData.get("weight_kg"));
  const body_fat_pct = optionalNumber(formData.get("body_fat_pct"));
  const waist_cm = optionalNumber(formData.get("waist_cm"));
  const chest_cm = optionalNumber(formData.get("chest_cm"));
  const arm_cm = optionalNumber(formData.get("arm_cm"));
  const thigh_cm = optionalNumber(formData.get("thigh_cm"));
  const neck_cm = optionalNumber(formData.get("neck_cm"));
  const notesRaw = formData.get("notes");
  const notes = typeof notesRaw === "string" && notesRaw.trim() !== "" ? notesRaw.trim() : null;

  let bmi: number | null = null;
  if (height_cm != null && weight_kg != null && height_cm > 0) {
    const heightM = height_cm / 100;
    bmi = Math.round((weight_kg / (heightM * heightM)) * 10) / 10;
  }

  const { error: insertError } = await supabase.from("assessments").insert({
    member_id,
    recorded_by: user.id,
    recorded_at: new Date().toISOString(),
    source: "manual",
    height_cm,
    weight_kg,
    bmi,
    body_fat_pct,
    waist_cm,
    chest_cm,
    arm_cm,
    thigh_cm,
    neck_cm,
    notes,
  });

  if (insertError) throw new Error(insertError.message);

  // Soft-fail audit — do not block the assessment on audit RPC errors
  await supabase.rpc("insert_audit_log", {
    p_action: "CREATE_ASSESSMENT",
    p_entity_type: "assessment",
    p_entity_id: null,
    p_member_id: member_id,
    p_details: { trainer_id: trainer.id, source: "manual", bmi },
  });

  revalidatePath("/trainer/assessments");
}
