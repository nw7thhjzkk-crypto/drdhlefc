import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analytics" };

/** Soft-fail wrapper — never invent numbers when a query fails. */
async function safeCount(
  label: string,
  run: () => PromiseLike<{ count: number | null; error: { message: string } | null }>,
): Promise<{ label: string; value: number | null; error?: string }> {
  try {
    const { count, error } = await run();
    if (error) return { label, value: null, error: error.message };
    return { label, value: count ?? 0 };
  } catch (e) {
    return { label, value: null, error: e instanceof Error ? e.message : "query failed" };
  }
}

export default async function OwnerAnalyticsPage() {
  const supabase = await createClient();

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

  const [
    activeMembers,
    totalMembers,
    paymentsMonthRes,
    attendance7d,
    openBookings,
    leadsRowsRes,
  ] = await Promise.all([
    safeCount("Active members", () =>
      supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
    ),
    safeCount("Total members", () =>
      supabase.from("members").select("*", { count: "exact", head: true }),
    ),
    (async () => {
      try {
        const { data, error } = await supabase
          .from("payments")
          .select("amount")
          .gte("paid_at", firstDayOfMonth);
        if (error) return { sum: null as number | null, count: null as number | null, error: error.message };
        const rows = data ?? [];
        const sum = rows.reduce((s, p) => s + Number(p.amount ?? 0), 0);
        return { sum, count: rows.length, error: undefined as string | undefined };
      } catch (e) {
        return {
          sum: null as number | null,
          count: null as number | null,
          error: e instanceof Error ? e.message : "query failed",
        };
      }
    })(),
    safeCount("Check-ins (7d)", () =>
      supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("check_in", true)
        .gte("occurred_at", sevenDaysAgo),
    ),
    safeCount("Open bookings", () =>
      supabase
        .from("activity_bookings")
        .select("*", { count: "exact", head: true })
        .in("status", ["booked", "confirmed", "pending"]),
    ),
    (async () => {
      try {
        const { data, error } = await supabase.from("leads").select("stage");
        if (error) return { rows: [] as { stage: string | null }[], error: error.message };
        return { rows: data ?? [], error: undefined as string | undefined };
      } catch (e) {
        return {
          rows: [] as { stage: string | null }[],
          error: e instanceof Error ? e.message : "query failed",
        };
      }
    })(),
  ]);

  const stageCounts: Record<string, number> = {};
  for (const row of leadsRowsRes.rows) {
    const stage = (row.stage || "unknown").toLowerCase();
    stageCounts[stage] = (stageCounts[stage] ?? 0) + 1;
  }
  const stageEntries = Object.entries(stageCounts).sort((a, b) => b[1] - a[1]);

  const fmtInr = (n: number) =>
    n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const kpis: { label: string; value: string; sub?: string; accent: string; empty?: boolean }[] = [
    {
      label: "Active members",
      value: activeMembers.value == null ? "—" : String(activeMembers.value),
      sub:
        totalMembers.value == null
          ? activeMembers.error ?? "unavailable"
          : `${totalMembers.value} total`,
      accent: "#3B82F6",
      empty: activeMembers.value === 0,
    },
    {
      label: "Payments this month",
      value: paymentsMonthRes.sum == null ? "—" : `₹${fmtInr(paymentsMonthRes.sum)}`,
      sub:
        paymentsMonthRes.count == null
          ? paymentsMonthRes.error ?? "unavailable"
          : `${paymentsMonthRes.count} payment${paymentsMonthRes.count === 1 ? "" : "s"}`,
      accent: "#22C55E",
      empty: paymentsMonthRes.count === 0,
    },
    {
      label: "Attendance (7 days)",
      value: attendance7d.value == null ? "—" : String(attendance7d.value),
      sub: attendance7d.error ?? "check-ins",
      accent: "#8B5CF6",
      empty: attendance7d.value === 0,
    },
    {
      label: "Open activity bookings",
      value: openBookings.value == null ? "—" : String(openBookings.value),
      sub: openBookings.error ?? "booked / confirmed / pending",
      accent: "#F97316",
      empty: openBookings.value === 0,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">
            Live KPIs from members, leads, payments, attendance, and bookings
          </p>
        </div>
        <Link href="/owner/dashboard" className="btn btn-ghost btn-sm">
          ← Dashboard
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {kpis.map((k) => (
          <div
            key={k.label}
            className="stat-card"
            style={{ borderLeft: `4px solid ${k.accent}` }}
          >
            <div className="stat-card-label">{k.label}</div>
            <div className="stat-card-value" style={{ color: "#111827" }}>
              {k.value}
            </div>
            {k.sub && <div className="stat-card-sub">{k.sub}</div>}
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-header">
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827" }}>
            Leads by stage
          </h2>
        </div>
        <div className="card-body">
          {leadsRowsRes.error ? (
            <div className="empty-state" style={{ padding: "1.5rem" }}>
              <div className="empty-state-title">Could not load leads</div>
              <div className="empty-state-body">{leadsRowsRes.error}</div>
            </div>
          ) : stageEntries.length === 0 ? (
            <div className="empty-state" style={{ padding: "1.5rem" }}>
              <div className="empty-state-title">No leads yet</div>
              <div className="empty-state-body">
                Stage breakdown will appear once CRM has data.{" "}
                <Link href="/owner/leads" style={{ fontWeight: 700, textDecoration: "underline" }}>
                  Open CRM →
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {stageEntries.map(([stage, count]) => (
                <div
                  key={stage}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-surface-border)",
                    fontSize: "0.875rem",
                  }}
                >
                  <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{stage}</span>
                  <span className="badge badge-warning">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827" }}>
            Quick links
          </h2>
        </div>
        <div
          className="card-body"
          style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
        >
          {[
            { href: "/owner/members", label: "Members" },
            { href: "/owner/payments", label: "Payments" },
            { href: "/owner/attendance", label: "Attendance" },
            { href: "/owner/leads", label: "CRM" },
            { href: "/owner/activities", label: "Activities" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="btn btn-ghost btn-sm">
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
