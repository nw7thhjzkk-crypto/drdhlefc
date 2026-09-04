"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Record a payment against a membership.
 *
 * Security:
 * - Uses getUser() (server-side JWT verification), not getSession().
 * - Does NOT accept paid_amount, pending_amount, or member_id from the
 *   caller — all financial invariants are enforced inside the
 *   SECURITY DEFINER RPC record_payment_atomic().
 * - The RPC: validates amount > 0, acquires a FOR UPDATE lock on the
 *   membership row, prevents overpayment, inserts the payment with
 *   created_by = auth.uid(), updates membership totals atomically, and
 *   writes an audit record — all in one database transaction.
 */
export async function recordPayment(formData: FormData) {
  const supabase = await createClient();

  // getUser() performs server-side token verification
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) return { error: "Not authenticated" };

  const membership_id = formData.get("membership_id") as string;
  const amount_raw    = formData.get("amount") as string;
  const method        = (formData.get("method")    as string) || null;
  const reference     = (formData.get("reference") as string) || null;
  const notes         = (formData.get("notes")     as string) || null;

  if (!membership_id || !amount_raw) {
    return { error: "Missing required fields" };
  }

  const amount = parseFloat(amount_raw);
  if (isNaN(amount) || amount <= 0) {
    return { error: "Amount must be a positive number" };
  }

  // Delegate entirely to the SECURITY DEFINER RPC.
  // The RPC re-validates amount, locks the membership row FOR UPDATE,
  // prevents overpayment, inserts the payment, updates the membership,
  // and writes the audit log — atomically in one transaction.
  const { data: payment_id, error: rpcError } = await supabase.rpc(
    "record_payment_atomic",
    {
      p_membership_id: membership_id,
      p_amount:        amount,
      p_method:        method,
      p_reference:     reference,
      p_notes:         notes,
    }
  );

  if (rpcError) return { error: rpcError.message };

  // member_id is not trusted from the form for revalidation paths;
  // we fetch it from the membership to build the correct cache path.
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
