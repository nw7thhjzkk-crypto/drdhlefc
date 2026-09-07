"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addLead(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") {
    throw new Error("Unauthorized");
  }

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

  try {
    await supabase.rpc("insert_audit_log", {
      p_action: "CREATE_LEAD",
      p_entity_type: "lead",
      p_entity_id: data.id,
      p_member_id: null,
      p_details: { name, source, stage },
    });
  } catch (err) {
    console.error("Failed to insert audit log:", err);
  }

  revalidatePath("/owner/leads");
}

export async function seedStarterLeads() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") {
    throw new Error("Unauthorized");
  }

  const { count } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true });

  if (count && count > 0) {
    return;
  }

  const starterLeads = [
    { name: "John Doe", phone: "555-0101", email: "john@example.com", source: "Website", stage: "new" },
    { name: "Jane Smith", phone: "555-0102", email: "jane@example.com", source: "Instagram", stage: "contacted" },
    { name: "Mike Johnson", phone: "555-0103", email: "mike@example.com", source: "Referral", stage: "trial" }
  ];

  await supabase.from("leads").insert(starterLeads);
  revalidatePath("/owner/leads");
}

export async function updateLead(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Double check authorization on the server side
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") {
    throw new Error("Unauthorized");
  }

  const id = formData.get("id") as string;
  const stage = formData.get("stage") as string;
  const assigned_trainer = formData.get("assigned_trainer") as string || null;
  const follow_up_at = formData.get("follow_up_at") as string || null;

  if (!id) throw new Error("Lead ID is required");

  const updatePayload: Record<string, string | null> = { stage };
  if (assigned_trainer !== undefined) updatePayload.assigned_trainer = assigned_trainer;
  if (follow_up_at !== undefined) updatePayload.follow_up_at = follow_up_at ? new Date(follow_up_at).toISOString() : null;

  const { error } = await supabase
    .from("leads")
    .update(updatePayload)
    .eq("id", id);

  if (error) throw new Error(error.message);

  try {
    await supabase.rpc("insert_audit_log", {
      p_action: "UPDATE_LEAD",
      p_entity_type: "lead",
      p_entity_id: id,
      p_member_id: null,
      p_details: updatePayload,
    });
  } catch (err) {
    console.error("Failed to insert audit log:", err);
  }

  revalidatePath("/owner/leads");
}
