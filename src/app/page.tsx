import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { PublicWebsite } from "@/components/public/PublicWebsite";

export default async function RootPage() {
  // Role-based redirect is a convenience for signed-in visitors. The public
  // website must still render when Supabase is not configured or temporarily
  // unreachable — real route protection remains in middleware (unchanged).
  try {
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
  } catch {
    // Supabase unavailable — show the public site. No private data is exposed.
  }

  return <PublicWebsite />;
}
