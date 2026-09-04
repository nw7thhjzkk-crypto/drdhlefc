"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addLead(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const name   = formData.get("name")   as string;
  const phone  = formData.get("phone")  as string;
  const email  = formData.get("email")  as string;
  const source = formData.get("source") as string;
  const stage  = formData.get("stage")  as string;

  const { data, error } = await supabase
    .from("leads")
    .insert({ name, phone, email, source, stage })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await supabase.rpc("insert_audit_log", {
    p_action: "CREATE_LEAD",
    p_entity_type: "lead",
    p_entity_id: data.id,
    p_member_id: null,
    p_details: { name, source, stage },
  });

  revalidatePath("/owner/leads");
}
