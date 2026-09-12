import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Suspense } from "react";
import DashboardCharts from "./DashboardCharts";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

interface ExpiringMembership {
  id?: string;
  end_date: string;
  members: { id?: string; name: string; member_code: string }[] | null;
  membership_plans: { name: string }[] | null;
}

export default async function OwnerDashboard() {
  const supabase = await createClient();

  const today = new Date();
  const todayStr          = today.toISOString().split("T")[0];
  const tomorrowStr       = new Date(today.getTime() + 86400000).toISOString().split("T")[0];
  const thirtyDaysStr     = new Date(today.getTime() + 30 * 86400000).toISOString().split("T")[0];
    const firstDayOfMonth   = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
  const firstDayOfYear    = new Date(today.getFullYear(), 0, 1).toISOString().split("T")[0];
  const sixMonthsAgo      = new Date(today.getFullYear(), today.getMonth() - 5, 1).toISOString().split("T")[0];
  const currentMonthNum   = today.getMonth() + 1;

  const [
    { count: totalMembers },
    { count: activeMembers },
    { count: inactiveMembers },
    { data: todayPayments },
    { data: monthPayments },
    { data: yearPayments },
    { data: pendingMemberships },
    { data: genderData },
    { data: expiringMemberships },
    { count: expiredMemberships },
    { data: membersWithDob },
    { count: todayAttendance },
    { count: openLeads },
    { data: lowStockProducts },
    { count: newLeadsThisMonth },
    { count: membershipPlansCount },
    { count: productsCount },
    { count: exercisesCount },
    { count: groupActivitiesCount },
    { count: dietPlansCount },
    { count: workoutPlansCount },
    { data: recentMembers },
    { data: recentPayments },
  ] = await Promise.all([
    supabase.from("members").select("*", { count: "exact", head: true }),
    supabase.from("members").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("members").select("*", { count: "exact", head: true }).eq("status", "inactive"),
    supabase.from("payments").select("amount").gte("paid_at", todayStr).lt("paid_at", tomorrowStr),
    supabase.from("payments").select("amount").gte("paid_at", firstDayOfMonth),
    supabase.from("payments").select("amount").gte("paid_at", firstDayOfYear),
    supabase.from("memberships").select("pending_amount").gt("pending_amount", 0),
    supabase.from("members").select("gender").eq("status", "active"),
    supabase
      .from("memberships")
      .select("id, end_date, members(id, name, member_code), membership_plans(name)")
      .eq("status", "active")
      .gte("end_date", todayStr)
      .lte("end_date", thirtyDaysStr)
      .order("end_date", { ascending: true })
      .limit(8),
    supabase
      .from("memberships")
      .select("*", { count: "exact", head: true })
      .eq("status", "expired")
      .lt("end_date", todayStr),
    supabase.from("members").select("id, name, dob").eq("status", "active").not("dob", "is", null),
    supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .gte("occurred_at", todayStr)
      .lt("occurred_at", tomorrowStr),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .in("stage", ["new", "contacted", "follow-up", "trial"]),
    supabase
      .from("products")
      .select("id, name, stock_quantity, minimum_stock")
      .eq("status", "active")
      .filter("stock_quantity", "lte", "minimum_stock")
      .limit(5),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", firstDayOfMonth),
    supabase.from("membership_plans").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("products").select("*", { count: "exact", head: true }).neq("status", "inactive"),
    supabase.from("exercises").select("*", { count: "exact", head: true }),
    supabase.from("group_activities").select("*", { count: "exact", head: true }).neq("status", "cancelled"),
    supabase.from("diet_plans").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("workout_plans").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("members")
      .select("id, name, member_code, created_at, status")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("payments")
      .select("id, amount, method, paid_at, members(name)")
      .order("paid_at", { ascending: false })
      .limit(5),
  ]);

  // Aggregations
  const todaysCollection  = todayPayments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const monthlyCollection = monthPayments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const yearlyCollection  = yearPayments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const totalPending      = pendingMemberships?.reduce((s, m) => s + Number(m.pending_amount), 0) ?? 0;

  // Gender breakdown for chart
  const genderCount: Record<string, number> = { Male: 0, Female: 0, Other: 0 };
  genderData?.forEach((m) => {
    const g = m.gender as string | null;
    if (g === "Male" || g === "Female") genderCount[g]++;
    else if (g) genderCount["Other"]++;
  });
  const chartGenderData = Object.entries(genderCount).map(([name, value]) => ({ name, value }));

  // 6-month revenue trend
  const { data: revenuePayments } = await supabase
    .from("payments")
    .select("amount, paid_at")
    .gte("paid_at", sixMonthsAgo)
    .lt("paid_at", tomorrowStr);

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const revenueMap: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    revenueMap[`${monthNames[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`] = 0;
  }
  revenuePayments?.forEach((p) => {
    if (p.paid_at) {
      const d   = new Date(p.paid_at);
      const key = `${monthNames[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`;
      if (key in revenueMap) revenueMap[key] += Number(p.amount);
    }
  });
  const chartRevenueData = Object.entries(revenueMap).map(([name, revenue]) => ({ name, revenue }));

  // Birthdays this month
  const birthdaysThisMonth = (membersWithDob ?? []).filter((m) => {
    if (!m.dob) return false;
    return new Date(m.dob).getMonth() + 1 === currentMonthNum;
  });

  const fmt = (n: number) =>
    n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const checklistItems = [
    { name: "Membership Plans", count: membershipPlansCount ?? 0, link: "/owner/plans" },
    { name: "Store Products", count: productsCount ?? 0, link: "/owner/store" },
    { name: "Exercises", count: exercisesCount ?? 0, link: "/owner/exercises" },
    { name: "Group Activities", count: groupActivitiesCount ?? 0, link: "/owner/activities" },
    { name: "Diet Plans", count: dietPlansCount ?? 0, link: "/owner/diet-plans" },
    { name: "Workout Plans", count: workoutPlansCount ?? 0, link: "/owner/workout-plans" },
    { name: "Leads", count: openLeads ?? 0, link: "/owner/leads" },
    { name: "Members", count: totalMembers ?? 0, link: "/owner/members" },
  ];

  const showChecklist = checklistItems.some(item => item.count === 0);

  const typedExpiring = (expiringMemberships ?? []) as ExpiringMembership[];

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {today.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link href="/owner/members/new" className="btn btn-primary btn-sm">
          + New Member
        </Link>
      </div>

      {/* First-Run Checklist */}
      {showChecklist && (
        <div className="card mb-6" style={{ borderColor: "var(--color-warning)", borderWidth: "1px", borderStyle: "solid" }}>
          <div className="card-header" style={{ backgroundColor: "#18181B", color: "var(--color-warning)", borderBottom: "1px solid #27272A" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>🚀 First-Run Checklist</h2>
          </div>
          <div className="dashboard-checklist-grid">
            {checklistItems.map(item => (
              <div key={item.name} className="dashboard-checklist-item">
                <div className="dashboard-checklist-item-name">
                  <span style={{ fontSize: "1.25rem" }}>
                    {item.count > 0 ? "✅" : "⭕"}
                  </span>
                  <span style={{ color: "#E4E4E7", fontSize: "0.875rem", fontWeight: 500 }}>
                    {item.name}
                  </span>
                </div>
                {item.count === 0 && (
                  <Link href={item.link} style={{ fontSize: "0.75rem", color: "var(--color-warning)", textDecoration: "underline", fontWeight: 600 }}>
                    Add
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="dashboard-kpi-grid">
        <StatCard label="Active Members"     value={String(activeMembers ?? 0)}  sub={`${totalMembers ?? 0} total · ${inactiveMembers ?? 0} inactive`} accent="#3B82F6" />
        <StatCard label="Today's Collection" value={`₹${fmt(todaysCollection)}`} sub={`₹${fmt(monthlyCollection)} this month`}                          accent="#22C55E" />
        <StatCard label="Pending Dues"       value={`₹${fmt(totalPending)}`}     sub="across all memberships"                                           accent="#EAB308" />
        <StatCard label="Today's Attendance" value={String(todayAttendance ?? 0)} sub="check-ins today"                                                  accent="#8B5CF6" />
        <StatCard label="Expiring (30 days)" value={String(typedExpiring.length)} sub={`${expiredMemberships ?? 0} already expired`}         accent="#EF4444" />
        <StatCard label="Open Leads"         value={String(openLeads ?? 0)}      sub={`${newLeadsThisMonth ?? 0} new this month`}                        accent="#F97316" />
      </div>

      {/* Main grid */}
      <div className="dashboard-main-grid">

        {/* Left — charts */}
        <div>
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <div className="card-header">
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827" }}>Revenue & Members — 6 Months</h2>
            </div>
            <div className="card-body">
              <Suspense fallback={<div className="dashboard-chart-loading">Loading charts...</div>}>
                <DashboardCharts genderData={chartGenderData} revenueData={chartRevenueData} />
              </Suspense>
            </div>
          </div>

          {/* Low stock alert */}
          {(lowStockProducts?.length ?? 0) > 0 && (
            <div className="alert alert-warning" style={{ marginBottom: "1.5rem" }}>
              <span>⚠️</span>
              <span>
                <strong>Low stock alert:</strong>{" "}
                {lowStockProducts!.map((p) => `${p.name} (${p.stock_quantity})`).join(", ")}.{" "}
                <Link href="/owner/store" style={{ fontWeight: 700, textDecoration: "underline" }}>View store →</Link>
              </span>
            </div>
          )}

          {/* Expiring memberships table */}
          <div className="card">
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827" }}>Memberships Expiring — Next 30 Days</h2>
              <Link href="/owner/members" className="btn btn-ghost btn-sm">View all</Link>
            </div>
            {typedExpiring.length > 0 ? (
              <div className="table-wrapper" style={{ border: "none", borderRadius: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Plan</th>
                      <th>Expires</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {typedExpiring.map((m) => {
                      const daysLeft = Math.ceil(
                        (new Date(m.end_date).getTime() - today.getTime()) / 86400000
                      );
                      return (
                        <tr key={m.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{m.members?.[0]?.name ?? "—"}</div>
                            <div style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>{m.members?.[0]?.member_code}</div>
                          </td>
                          <td style={{ fontSize: "0.875rem" }}>{m.membership_plans?.[0]?.name ?? "—"}</td>
                          <td>
                            <span className={`badge ${daysLeft <= 7 ? "badge-danger" : "badge-warning"}`}>
                              {m.end_date} ({daysLeft}d)
                            </span>
                          </td>
                          <td>
                            <Link href={`/owner/members/${m.members?.[0]?.id}`} className="btn btn-ghost btn-sm">
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="card-body">
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <div className="empty-state-title">No memberships expiring soon</div>
                  <div className="empty-state-body">
                    When active memberships approach their end date in the next
                    30 days, they will appear here for follow-up.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="dashboard-right-col">

          {/* Quick nav */}
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827" }}>Quick Actions</h2>
            </div>
            <div className="dashboard-quick-nav">
              {[
                { href: "/owner/members/new",    label: "New Member",   icon: "👤" },
                { href: "/owner/payments",        label: "Payments",     icon: "💳" },
                { href: "/owner/leads",           label: "Leads",        icon: "📞" },
                { href: "/owner/activities",      label: "Activities",   icon: "🗓️" },
                { href: "/owner/store",           label: "POS",          icon: "🛒" },
                { href: "/owner/audit",           label: "Audit Logs",   icon: "🔍" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "0.75rem 0.5rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-surface-border)",
                    textAlign: "center",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#374151",
                    textDecoration: "none",
                    gap: "0.25rem",
                    transition: "all 150ms",
                  }}
                  className="btn-ghost"
                >
                  <span style={{ fontSize: "1.25rem" }}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Birthdays */}
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827" }}>🎂 Birthdays This Month</h2>
            </div>
            <div className="card-body" style={{ padding: "0.75rem 1.25rem" }}>
              {birthdaysThisMonth.length > 0 ? (
                <ul className="dashboard-list">
                  {birthdaysThisMonth.map((m) => (
                    <li key={m.id} className="dashboard-list-item">
                      <span style={{ fontWeight: 600 }}>{m.name}</span>
                      <span style={{ color: "#9CA3AF" }}>
                        {new Date(m.dob!).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state" style={{ padding: "1.5rem" }}>
                  <div className="empty-state-icon">🎂</div>
                  <div className="empty-state-title">No birthdays this month</div>
                  <div className="empty-state-body">
                    Active members with a date of birth on file will show up
                    here when their birthday falls in the current month.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Revenue summary */}
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827" }}>Revenue Summary</h2>
            </div>
            <div className="card-body" style={{ padding: "0.75rem 1.25rem" }}>
              <ul className="dashboard-list">
                {[
                  { label: "Today",      value: `₹${fmt(todaysCollection)}`  },
                  { label: "This Month", value: `₹${fmt(monthlyCollection)}` },
                  { label: "This Year",  value: `₹${fmt(yearlyCollection)}`  },
                ].map(({ label, value }) => (
                  <li key={label} className="dashboard-list-item">
                    <span style={{ color: "#6B7280" }}>{label}</span>
                    <span style={{ fontWeight: 700, color: "#111827" }}>{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recent Members */}
          <div className="card">
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827" }}>Recent Members</h2>
              <Link href="/owner/members" className="btn btn-ghost btn-sm">View all</Link>
            </div>
            <div className="card-body" style={{ padding: "0.75rem 1.25rem" }}>
              {recentMembers && recentMembers.length > 0 ? (
                <ul className="dashboard-list">
                  {recentMembers.map((m) => (
                    <li key={m.id} className="dashboard-list-item">
                      <div>
                        <div style={{ fontWeight: 600 }}>{m.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>{m.member_code}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span className={`badge ${m.status === "active" ? "badge-success" : "badge-neutral"}`}>
                          {m.status}
                        </span>
                        <div style={{ fontSize: "0.75rem", color: "#9CA3AF", marginTop: "0.25rem" }}>
                          {new Date(m.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state" style={{ padding: "1.5rem" }}>
                  <div className="empty-state-icon">👤</div>
                  <div className="empty-state-title">No members yet</div>
                  <div className="empty-state-body">
                    New members will appear here once they are added to the system.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="card">
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827" }}>Recent Payments</h2>
              <Link href="/owner/payments" className="btn btn-ghost btn-sm">View all</Link>
            </div>
            <div className="card-body" style={{ padding: "0.75rem 1.25rem" }}>
              {recentPayments && recentPayments.length > 0 ? (
                <ul className="dashboard-list">
                  {recentPayments.map((p) => (
                    <li key={p.id} className="dashboard-list-item">
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.members?.[0]?.name ?? "—"}</div>
                        <div style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
                          {p.method ? p.method.charAt(0).toUpperCase() + p.method.slice(1) : "—"}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, color: "#065F46" }}>₹{fmt(Number(p.amount))}</div>
                        <div style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
                          {new Date(p.paid_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state" style={{ padding: "1.5rem" }}>
                  <div className="empty-state-icon">💳</div>
                  <div className="empty-state-title">No payments recorded</div>
                  <div className="empty-state-body">
                    Recent payments will appear here once members start making payments.
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div
      className="stat-card"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value" style={{ color: "#111827" }}>{value}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}
