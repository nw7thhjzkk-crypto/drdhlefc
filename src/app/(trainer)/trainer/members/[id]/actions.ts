"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addAssessment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const member_id = formData.get("member_id") as string;
  const height_cm = parseFloat(formData.get("height_cm") as string);
  const weight_kg = parseFloat(formData.get("weight_kg") as string);
  const body_fat_pct = formData.get("body_fat_pct") ? parseFloat(formData.get("body_fat_pct") as string) : null;
  const notes = formData.get("notes") as string;

  let bmi = null;
  if (height_cm > 0 && weight_kg > 0) {
    const height_m = height_cm / 100;
    bmi = parseFloat((weight_kg / (height_m * height_m)).toFixed(1));
  }

  const { error } = await supabase.from("assessments").insert({
    member_id,
    recorded_by: user.id,
    source: 'manual',
    height_cm,
    weight_kg,
    bmi,
    body_fat_pct,
    notes
  });

  if (error) {
    console.error("Error adding assessment:", error);
    throw new Error(error.message);
  }

  await supabase.from("audit_logs").insert({
    actor_profile_id: user.id,
    action: "CREATE",
    entity_type: "assessment",
    member_id: member_id
  });

  revalidatePath(`/trainer/members/${member_id}`);
}
