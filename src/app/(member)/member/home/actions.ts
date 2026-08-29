"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function bookActivity(activity_id: string, member_id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("activity_bookings").insert({
    activity_id,
    member_id,
    status: "booked"
  });

  if (error) {
    console.error("Error booking activity:", error);
    throw new Error(error.message);
  }

  await supabase.from("audit_logs").insert({
    actor_profile_id: user.id,
    action: "BOOK_ACTIVITY",
    entity_type: "activity_booking",
    entity_id: activity_id,
    member_id: member_id
  });

  revalidatePath("/member/home");
}
