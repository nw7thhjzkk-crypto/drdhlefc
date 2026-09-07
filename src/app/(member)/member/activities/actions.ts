"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function bookActivityAction(activity_id: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) throw new Error("Not authenticated");

  const { error } = await supabase.rpc("book_activity_for_member", {
    p_activity_id: activity_id,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/member/activities");
  revalidatePath("/member/home");
}

export async function cancelBookingAction(booking_id: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) throw new Error("Not authenticated");

  const { error } = await supabase.rpc("cancel_activity_booking", {
    p_booking_id: booking_id,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/member/activities");
  revalidatePath("/member/home");
}
