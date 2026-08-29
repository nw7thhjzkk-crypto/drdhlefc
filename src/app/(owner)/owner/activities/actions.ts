"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createActivity(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const trainer_id = formData.get("trainer_id") as string;
  const start_at = formData.get("start_at") as string;
  const duration_minutes = parseInt(formData.get("duration_minutes") as string, 10);
  const location = formData.get("location") as string;
  const capacity = parseInt(formData.get("capacity") as string, 10);

  const { error, data } = await supabase.from("group_activities").insert({
    name,
    description,
    trainer_id: trainer_id ? trainer_id : null,
    start_at: new Date(start_at).toISOString(),
    duration_minutes,
    location,
    capacity,
    status: "active"
  }).select().single();

  if (error) throw new Error(error.message);

  await supabase.from("audit_logs").insert({
    actor_profile_id: user.id,
    action: "CREATE",
    entity_type: "group_activity",
    entity_id: data.id,
    details: { name }
  });

  revalidatePath("/owner/activities");
}

export async function cancelActivity(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("group_activities")
    .update({ status: "cancelled", deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await supabase.from("audit_logs").insert({
    actor_profile_id: user.id,
    action: "CANCEL",
    entity_type: "group_activity",
    entity_id: id
  });

  revalidatePath("/owner/activities");
}
