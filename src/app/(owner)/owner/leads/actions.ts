"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addLead(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const source = formData.get("source") as string;
  const stage = formData.get("stage") as string;

  const { error } = await supabase.from("leads").insert({
    name,
    phone,
    email,
    source,
    stage,
  });

  if (error) {
    console.error("Error creating lead:", error);
    throw new Error(error.message);
  }

  await supabase.from("audit_logs").insert({
    actor_profile_id: user.id,
    action: "CREATE_LEAD",
    entity_type: "lead",
    details: { name, source }
  });

  revalidatePath("/owner/leads");
}
