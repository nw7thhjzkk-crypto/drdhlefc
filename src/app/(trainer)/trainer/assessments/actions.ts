"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function logAssessment(formData: FormData) {
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

  // Verify the target member is CURRENTLY assigned to this trainer.
  const { data: assignment, error: assignmentError } = await supabase
    .from("member_trainers")
    .select("id")
    .eq("member_id", member_id)
    .eq("trainer_id", trainer.id)
    .is("unassigned_at", null)
    .maybeSingle();

  if (assignmentError) throw new Error(assignmentError.message);

  if (!assignment) {
    throw new Error("Member is not currently assigned to you — cannot log assessment");
  }

  const height_cm_str = formData.get("height_cm") as string;
  const weight_kg_str = formData.get("weight_kg") as string;
  const body_fat_pct_str = formData.get("body_fat_pct") as string;

  const height_cm: number | null = height_cm_str ? parseFloat(height_cm_str) : null;
  const weight_kg: number | null = weight_kg_str ? parseFloat(weight_kg_str) : null;
  const body_fat_pct: number | null = body_fat_pct_str ? parseFloat(body_fat_pct_str) : null;

  let bmi: number | null = null;
  if (height_cm && weight_kg) {
    bmi = Number((weight_kg / Math.pow(height_cm / 100, 2)).toFixed(2));
  }

  const { error: insertError } = await supabase.from("assessments").insert({
    member_id,
    recorded_by: user.id, // Auth UID of the trainer who recorded it
    recorded_at: new Date().toISOString(),
    source: "manual",
    height_cm,
    weight_kg,
    body_fat_pct,
    bmi,
  });

  if (insertError) throw new Error(insertError.message);

  // Soft-fail on audit log
  await Promise.resolve(
    supabase.rpc("insert_audit_log", {
      p_action: "LOG_ASSESSMENT",
      p_entity_type: "assessments",
      p_entity_id: null,
      p_member_id: member_id,
      p_details: { trainer_id: trainer.id, height_cm, weight_kg, body_fat_pct, bmi },
    })
  ).catch((err) => {
    console.error("Failed to insert audit log:", err);
  });

  revalidatePath("/trainer/assessments");
}
