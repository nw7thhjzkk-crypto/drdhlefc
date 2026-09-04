import OwnerNav from "@/components/OwnerNav";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Owner Dashboard",
    template: "%s | DR DHL Owner",
  },
};

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth + role guard — every owner route is protected here
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "owner") {
    // Redirect non-owners to their appropriate home
    if (profile?.role === "trainer") redirect("/trainer/dashboard");
    if (profile?.role === "member") redirect("/member/home");
    redirect("/login");
  }

  return (
    <div className="erp-shell">
      {/* Sidebar */}
      <OwnerNav />

      {/* Main area */}
      <div className="erp-main">
        {/* Top bar */}
        <header className="erp-topbar">
          {/* Mobile menu button — sidebar toggle handled client-side via OwnerNav */}
          <div style={{ flex: 1 }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              fontSize: "0.875rem",
              color: "#374151",
            }}
          >
            <span
              style={{
                background: "rgba(201,168,76,0.12)",
                color: "var(--color-gold-dark)",
                fontWeight: 700,
                fontSize: "0.6875rem",
                letterSpacing: "0.06em",
                padding: "0.2rem 0.6rem",
                borderRadius: "9999px",
                textTransform: "uppercase",
              }}
            >
              Owner
            </span>
            <span style={{ fontWeight: 600 }}>
              {profile.full_name ?? user.email}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="erp-content">{children}</main>
      </div>
    </div>
  );
}
