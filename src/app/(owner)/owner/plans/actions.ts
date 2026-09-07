"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

import { type SupabaseClient } from "@supabase/supabase-js";

/**
 * Verify the caller is authenticated and is an owner.
 * Uses getUser() for server-side JWT verification.
 */
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

export async function createPlan(formData: FormData) {
  const supabase = await createClient();

  const auth = await verifyOwner(supabase);
  if (!auth) return { error: "Unauthorized" };

  const name         = formData.get("name")         as string;
  const duration_days = parseInt(formData.get("duration_days") as string);
  const price        = parseFloat(formData.get("price")        as string);
  const plan_type    = formData.get("plan_type")    as string;
  const description  = formData.get("description")  as string;

  const { data, error } = await supabase
    .from("membership_plans")
    .insert({
      name,
      duration_days,
      price,
      plan_type,
      description,
      status: "active",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  try {
    await supabase.rpc("insert_audit_log", {
      p_action:      "CREATE_PLAN",
      p_entity_type: "membership_plan",
      p_entity_id:   data.id,
      p_member_id:   null,
      p_details:     { name, price },
    });
  } catch (err) {
    console.error("Failed to insert audit log", err);
  }

  revalidatePath("/owner/plans");
  return { success: true };
}

export async function seedStarterMembershipPlans() {
  const supabase = await createClient();

  const auth = await verifyOwner(supabase);
  if (!auth) throw new Error("Unauthorized");

  // Check if plans already exist (idempotency)
  const { data: existingPlans, error: countError } = await supabase
    .from("membership_plans")
    .select("id")
    .limit(1);

  if (countError) throw new Error(countError.message);
  if (existingPlans && existingPlans.length > 0) {
    return; // Already seeded
  }

  const starterPlans = [
    {
      name: "Monthly Membership",
      duration_days: 30,
      price: 1499,
      plan_type: "Monthly",
      description: "Standard gym access during regular hours.",
      status: "active",
    },
    {
      name: "Quarterly Membership",
      duration_days: 90,
      price: 3999,
      plan_type: "Quarterly",
      description: "Three months of gym access — best mid-term value.",
      status: "active",
    },
    {
      name: "Annual Membership",
      duration_days: 365,
      price: 14999,
      plan_type: "Annual",
      description: "Best value: full year of premium access.",
      status: "active",
    },
  ];

  const { error: insertError } = await supabase
    .from("membership_plans")
    .insert(starterPlans);

  if (insertError) throw new Error(insertError.message);

  try {
    await supabase.rpc("insert_audit_log", {
      p_action: "SEED_STARTER_PLANS",
      p_entity_type: "membership_plan",
      p_entity_id: null,
      p_member_id: null,
      p_details: { count: starterPlans.length, currency: "INR" },
    });
  } catch (err) {
    console.error("Failed to insert audit log for seeding", err);
  }

  revalidatePath("/owner/plans");
}

export async function updatePlan(id: string, formData: FormData) {
  const supabase = await createClient();

  const auth = await verifyOwner(supabase);
  if (!auth) return { error: "Unauthorized" };

  const name         = formData.get("name")         as string;
  const duration_days = parseInt(formData.get("duration_days") as string);
  const price        = parseFloat(formData.get("price")        as string);
  const plan_type    = formData.get("plan_type")    as string;
  const description  = formData.get("description")  as string;
  const status       = formData.get("status")       as string;

  const { error } = await supabase
    .from("membership_plans")
    .update({ name, duration_days, price, plan_type, description, status })
    .eq("id", id);

  if (error) return { error: error.message };

  try {
    await supabase.rpc("insert_audit_log", {
      p_action:      "UPDATE_PLAN",
      p_entity_type: "membership_plan",
      p_entity_id:   id,
      p_member_id:   null,
      p_details:     { name, status },
    });
  } catch (err) {
    console.error("Failed to insert audit log", err);
  }

  revalidatePath("/owner/plans");
  return { success: true };
}
