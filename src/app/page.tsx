import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { PublicWebsite } from "@/components/public/PublicWebsite";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "owner") redirect("/owner/dashboard");
    if (profile?.role === "trainer") redirect("/trainer/dashboard");
    if (profile?.role === "member") redirect("/member/home");
  }

  return <PublicWebsite />;
}
