"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function recordPayment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Unauthorized" };
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'owner') {
    return { error: "Unauthorized: Insufficient permissions" };
  }
  const userId = user.id;

  const member_id = formData.get("member_id") as string;
  const membership_id = formData.get("membership_id") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const method = formData.get("method") as string;
  const reference = formData.get("reference") as string;
  const notes = formData.get("notes") as string;

  if (!member_id || !membership_id || isNaN(amount)) {
    return { error: "Missing required fields" };
  }

  // 1. Insert payment
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      member_id,
      membership_id,
      amount,
      method,
      reference,
      notes,
      created_by: userId
    })
    .select("id")
    .single();

  if (paymentError) return { error: paymentError.message };

  // 2. Fetch current membership to calculate new totals
  const { data: currentMembership } = await supabase
    .from("memberships")
    .select("total_amount, paid_amount")
    .eq("id", membership_id)
    .single();

  if (currentMembership) {
    const newPaidAmount = Number(currentMembership.paid_amount) + amount;
    const newPendingAmount = Number(currentMembership.total_amount) - newPaidAmount;
    const newStatus = newPendingAmount <= 0 ? "active" : "pending_payment"; // Simple status logic

    // 3. Update membership
    await supabase
      .from("memberships")
      .update({
        paid_amount: newPaidAmount,
        pending_amount: newPendingAmount,
        status: newStatus
      })
      .eq("id", membership_id);
  }

  if (userId) {
    await supabase.from("audit_logs").insert({
      actor_profile_id: userId,
      action: "record_payment",
      entity_type: "payment",
      entity_id: payment.id,
      member_id: member_id,
      details: { amount, method }
    });
  }

  revalidatePath("/owner/payments");
  revalidatePath(`/owner/members/${member_id}`);
  return { success: true };
}
