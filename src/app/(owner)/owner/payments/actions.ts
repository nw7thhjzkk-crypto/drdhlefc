"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { type SupabaseClient } from "@supabase/supabase-js";

/**
 * Verify the caller is authenticated and is an owner.
 * Uses getUser() for server-side JWT verification (not a local cookie read).
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

/**
 * Record a payment against a membership.
 *
 * Security:
 * - Owner role gate via verifyOwner (same pattern as members/actions).
 * - Uses getUser() (server-side JWT verification), not getSession().
 * - Does NOT accept paid_amount, pending_amount, or member_id from the
 *   caller — all financial invariants are enforced inside the
 *   SECURITY DEFINER RPC record_payment_atomic().
 */
export async function recordPayment(formData: FormData) {
  const supabase = await createClient();

  const auth = await verifyOwner(supabase);
  if (!auth) return { error: "Unauthorized" };

  const membership_id = formData.get("membership_id") as string;
  const amount_raw = formData.get("amount") as string;
  const method = (formData.get("method") as string) || null;
  const reference = (formData.get("reference") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!membership_id || !amount_raw) {
    return { error: "Missing required fields" };
  }

  const amount = parseFloat(amount_raw);
  if (isNaN(amount) || amount <= 0) {
    return { error: "Amount must be a positive number" };
  }

  const { data: payment_id, error: rpcError } = await supabase.rpc(
    "record_payment_atomic",
    {
      p_membership_id: membership_id,
      p_amount: amount,
      p_method: method,
      p_reference: reference,
      p_notes: notes,
    }
  );

  if (rpcError) return { error: rpcError.message };

  const { data: membership } = await supabase
    .from("memberships")
    .select("member_id")
    .eq("id", membership_id)
    .single();

  revalidatePath("/owner/payments");
  if (membership?.member_id) {
    revalidatePath(`/owner/members/${membership.member_id}`);
  }

  return { success: true, payment_id };
}
