"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Book an activity for the currently authenticated member.
 *
 * Security: member_id is NEVER accepted from the caller.
 * All capacity checks, duplicate checks, and the insert itself happen
 * inside the SECURITY DEFINER RPC `book_activity_for_member`, which
 * derives member_id from auth.uid() at the database level.
 */
export async function bookActivity(activity_id: string) {
  const supabase = await createClient();

  // Verify the caller is authenticated (getUser() performs server-side JWT verification)
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) throw new Error("Not authenticated");

  // Delegate entirely to the SECURITY DEFINER RPC.
  // The RPC: derives member_id from auth.uid(), locks the activity row
  // FOR UPDATE, checks capacity, prevents duplicate bookings, inserts,
  // and writes the audit log — all atomically.
  const { error } = await supabase.rpc("book_activity_for_member", {
    p_activity_id: activity_id,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/member/home");
}

/**
 * Cancel an active booking.
 *
 * The SECURITY DEFINER RPC cancel_activity_booking verifies the caller
 * is either the booking owner (member) or an owner, and performs the
 * status update atomically with an audit record.
 */
export async function cancelBooking(booking_id: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) throw new Error("Not authenticated");

  const { error } = await supabase.rpc("cancel_activity_booking", {
    p_booking_id: booking_id,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/member/home");
}
