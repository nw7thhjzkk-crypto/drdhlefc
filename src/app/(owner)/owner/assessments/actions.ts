"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { calculateBMI } from "@/lib/bmi";

export async function logAssessment(formData: FormData) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) throw new Error("Not authenticated");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "owner") {
    throw new Error("Unauthorized");
  }

  const member_id = formData.get("member_id") as string;
  if (!member_id) throw new Error("member_id is required");

  const height_cm_str = formData.get("height_cm") as string;
  const weight_kg_str = formData.get("weight_kg") as string;
  const body_fat_pct_str = formData.get("body_fat_pct") as string;

  const height_cm: number | null = height_cm_str ? parseFloat(height_cm_str) : null;
  const weight_kg: number | null = weight_kg_str ? parseFloat(weight_kg_str) : null;
  const body_fat_pct: number | null = body_fat_pct_str ? parseFloat(body_fat_pct_str) : null;

  const bmi = calculateBMI(height_cm, weight_kg);

  const { error: insertError } = await supabase.from("assessments").insert({
    member_id,
    recorded_by: user.id, // Auth UID of the owner who recorded it
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
      p_details: { height_cm, weight_kg, body_fat_pct, bmi },
    })
  ).catch((err) => {
    console.error("Failed to insert audit log:", err);
  });

  revalidatePath("/owner/assessments");
}

export async function updateAssessment(assessmentId: string, formData: FormData) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) throw new Error("Not authenticated");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "owner") {
    throw new Error("Unauthorized");
  }

  if (!assessmentId) throw new Error("assessmentId is required");

  // Fetch the assessment to ensure it exists and get member_id for logging
  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .select("id, member_id")
    .eq("id", assessmentId)
    .single();

  if (assessmentError || !assessment) {
    throw new Error("Assessment not found");
  }

  const height_cm_str = formData.get("height_cm") as string;
  const weight_kg_str = formData.get("weight_kg") as string;
  const body_fat_pct_str = formData.get("body_fat_pct") as string;

  const height_cm: number | null = height_cm_str ? parseFloat(height_cm_str) : null;
  const weight_kg: number | null = weight_kg_str ? parseFloat(weight_kg_str) : null;
  const body_fat_pct: number | null = body_fat_pct_str ? parseFloat(body_fat_pct_str) : null;

  const bmi = calculateBMI(height_cm, weight_kg);

  const { error: updateError } = await supabase
    .from("assessments")
    .update({
      height_cm,
      weight_kg,
      body_fat_pct,
      bmi,
    })
    .eq("id", assessmentId);

  if (updateError) throw new Error(updateError.message);

  // Soft-fail on audit log
  await Promise.resolve(
    supabase.rpc("insert_audit_log", {
      p_action: "UPDATE_ASSESSMENT",
      p_entity_type: "assessments",
      p_entity_id: assessmentId,
      p_member_id: assessment.member_id,
      p_details: { height_cm, weight_kg, body_fat_pct, bmi },
    })
  ).catch((err) => {
    console.error("Failed to insert audit log:", err);
  });

  revalidatePath("/owner/assessments");
}
