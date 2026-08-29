"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function logAttendance(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: trainer } = await supabase.from("trainers").select("id").eq("profile_id", user.id).single();
  if (!trainer) throw new Error("Trainer profile not found");

  const member_id = formData.get("member_id") as string;
  const notes = formData.get("notes") as string;

  const { error } = await supabase.from("attendance").insert({
    member_id,
    trainer_id: trainer.id,
    method: "manual",
    check_in: true,
    notes
  });

  if (error) throw new Error(error.message);

  await supabase.from("audit_logs").insert({
    actor_profile_id: user.id,
    action: "LOG_ATTENDANCE",
    entity_type: "attendance",
    member_id: member_id
  });

  revalidatePath("/trainer/attendance");
}
