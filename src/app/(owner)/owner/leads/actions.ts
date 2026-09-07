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

export async function updateLeadStage(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const id = formData.get("id") as string;
  const stage = formData.get("stage") as string;

  const { error } = await supabase
    .from("leads")
    .update({ stage })
    .eq("id", id);

  if (error) throw new Error(error.message);

  try {
    await supabase.rpc("insert_audit_log", {
      p_action: "UPDATE_LEAD_STAGE",
      p_entity_type: "lead",
      p_entity_id: id,
      p_member_id: null,
      p_details: { stage },
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }

  revalidatePath("/owner/leads");
}

export async function assignLeadTrainer(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const id = formData.get("id") as string;
  const trainerId = formData.get("trainer_id") as string;
  const assigned_trainer = trainerId === "unassigned" ? null : trainerId;

  const { error } = await supabase
    .from("leads")
    .update({ assigned_trainer })
    .eq("id", id);

  if (error) throw new Error(error.message);

  try {
    await supabase.rpc("insert_audit_log", {
      p_action: "ASSIGN_LEAD_TRAINER",
      p_entity_type: "lead",
      p_entity_id: id,
      p_member_id: null,
      p_details: { assigned_trainer },
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }

  revalidatePath("/owner/leads");
}

export async function setLeadFollowUp(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const id = formData.get("id") as string;
  const followUpDate = formData.get("follow_up_at") as string;
  const follow_up_at = followUpDate ? new Date(followUpDate).toISOString() : null;

  const { error } = await supabase
    .from("leads")
    .update({ follow_up_at })
    .eq("id", id);

  if (error) throw new Error(error.message);

  try {
    await supabase.rpc("insert_audit_log", {
      p_action: "SET_LEAD_FOLLOW_UP",
      p_entity_type: "lead",
      p_entity_id: id,
      p_member_id: null,
      p_details: { follow_up_at },
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }

  revalidatePath("/owner/leads");
}
