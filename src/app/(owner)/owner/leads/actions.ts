"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { type SupabaseClient } from "@supabase/supabase-js";

const LEAD_STAGES = ["New", "Contacted", "Trial", "Won", "Lost"] as const;
type LeadStage = (typeof LEAD_STAGES)[number];

async function verifyOwner(
  supabase: SupabaseClient
): Promise<{ userId: string } | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") return null;
  return { userId: user.id };
}

async function softAudit(
  supabase: SupabaseClient,
  args: {
    p_action: string;
    p_entity_type: string;
    p_entity_id: string | null;
    p_member_id: string | null;
    p_details: Record<string, unknown>;
  }
) {
  try {
    await supabase.rpc("insert_audit_log", args);
  } catch {
    // Soft-fail: CRM updates must not block on audit RPC issues
  }
}

export async function addLead(formData: FormData) {
  const supabase = await createClient();
  const auth = await verifyOwner(supabase);
  if (!auth) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const source = formData.get("source") as string;
  const stage = formData.get("stage") as string;

  if (!LEAD_STAGES.includes(stage as LeadStage)) {
    throw new Error("Invalid stage");
  }

  const { data, error } = await supabase
    .from("leads")
    .insert({ name, phone, email, source, stage })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await softAudit(supabase, {
    p_action: "CREATE_LEAD",
    p_entity_type: "lead",
    p_entity_id: data.id,
    p_member_id: null,
    p_details: { name, source, stage },
  });

  revalidatePath("/owner/leads");
}

export async function updateLeadStage(leadId: string, formData: FormData) {
  const supabase = await createClient();
  const auth = await verifyOwner(supabase);
  if (!auth) return { error: "Unauthorized" };

  const stage = String(formData.get("stage") ?? "");
  if (!LEAD_STAGES.includes(stage as LeadStage)) {
    return { error: "Invalid stage" };
  }
  if (!leadId) return { error: "Missing lead id" };

  const { error } = await supabase
    .from("leads")
    .update({ stage, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) return { error: error.message };

  await softAudit(supabase, {
    p_action: "UPDATE_LEAD_STAGE",
    p_entity_type: "lead",
    p_entity_id: leadId,
    p_member_id: null,
    p_details: { stage },
  });

  revalidatePath("/owner/leads");
  return { success: true };
}

export async function assignLeadTrainer(leadId: string, formData: FormData) {
  const supabase = await createClient();
  const auth = await verifyOwner(supabase);
  if (!auth) return { error: "Unauthorized" };

  if (!leadId) return { error: "Missing lead id" };

  const raw = String(formData.get("trainer_id") ?? "");
  const trainerId = raw.trim() === "" ? null : raw;

  if (trainerId) {
    const { data: trainer, error: trainerError } = await supabase
      .from("trainers")
      .select("id")
      .eq("id", trainerId)
      .neq("status", "inactive")
      .maybeSingle();

    if (trainerError) return { error: trainerError.message };
    if (!trainer) return { error: "Trainer not found" };
  }

  const { error } = await supabase
    .from("leads")
    .update({
      assigned_trainer: trainerId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (error) return { error: error.message };

  await softAudit(supabase, {
    p_action: "ASSIGN_LEAD_TRAINER",
    p_entity_type: "lead",
    p_entity_id: leadId,
    p_member_id: null,
    p_details: { assigned_trainer: trainerId },
  });

  revalidatePath("/owner/leads");
  return { success: true };
}

export async function setLeadFollowUp(leadId: string, formData: FormData) {
  const supabase = await createClient();
  const auth = await verifyOwner(supabase);
  if (!auth) return { error: "Unauthorized" };

  if (!leadId) return { error: "Missing lead id" };

  const raw = String(formData.get("follow_up_at") ?? "").trim();
  let followUpAt: string | null = null;

  if (raw) {
    // date input yields YYYY-MM-DD; store as noon UTC to avoid TZ edge noise
    const parsed = new Date(`${raw}T12:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      return { error: "Invalid follow-up date" };
    }
    followUpAt = parsed.toISOString();
  }

  const { error } = await supabase
    .from("leads")
    .update({
      follow_up_at: followUpAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (error) return { error: error.message };

  await softAudit(supabase, {
    p_action: "SET_LEAD_FOLLOW_UP",
    p_entity_type: "lead",
    p_entity_id: leadId,
    p_member_id: null,
    p_details: { follow_up_at: followUpAt },
  });

  revalidatePath("/owner/leads");
  return { success: true };
}
