import { createClient } from "@/utils/supabase/server";
import PlansClient from "./plans-client";

export default async function PlansPage() {
  const supabase = await createClient();

  const { data: plans } = await supabase
    .from("membership_plans")
    .select("*")
    .order("created_at", { ascending: false });

  return <PlansClient plans={plans || []} />;
}
