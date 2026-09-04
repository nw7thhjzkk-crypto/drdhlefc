import TrainerNav from "@/components/TrainerNav";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Trainer", template: "%s | DR DHL Trainer" },
};

export default async function TrainerLayout({
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

  if (!profile || profile.role !== "trainer") {
    if (profile?.role === "owner")  redirect("/owner/dashboard");
    if (profile?.role === "member") redirect("/member/home");
    redirect("/login");
  }

  return (
    <div className="app-shell">
      {/* Top bar */}
      <header className="app-topbar">
        <span style={{ fontSize: "1.25rem" }}>🏋️</span>
        <span className="app-topbar-title">DR DHL Fitness</span>
        <span
          style={{
            fontSize: "0.6875rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            padding: "0.2rem 0.6rem",
            borderRadius: "9999px",
            background: "rgba(201,168,76,0.15)",
            color: "var(--color-gold)",
            textTransform: "uppercase",
          }}
        >
          Trainer
        </span>
        <Link
          href="/auth/logout"
          style={{ fontSize: "0.75rem", color: "var(--color-silver-dark)", marginLeft: "0.5rem" }}
        >
          Sign out
        </Link>
      </header>

      {/* Page content */}
      <main className="app-content">{children}</main>

      {/* Bottom navigation */}
      <TrainerNav />
    </div>
  );
}
