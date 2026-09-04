import MemberNav from "@/components/MemberNav";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "My Fitness", template: "%s | DR DHL Fitness" },
};

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "member") {
    if (profile?.role === "owner")   redirect("/owner/dashboard");
    if (profile?.role === "trainer") redirect("/trainer/dashboard");
    redirect("/login");
  }

  return (
    <div className="app-shell">
      {/* Top bar */}
      <header className="app-topbar">
        <span style={{ fontSize: "1.25rem" }}>🏆</span>
        <span className="app-topbar-title">DR DHL Fitness</span>
        <Link
          href="/auth/logout"
          style={{ fontSize: "0.75rem", color: "var(--color-silver-dark)" }}
        >
          Sign out
        </Link>
      </header>

      {/* Page content */}
      <main className="app-content">{children}</main>

      {/* Bottom nav */}
      <MemberNav />
    </div>
  );
}
