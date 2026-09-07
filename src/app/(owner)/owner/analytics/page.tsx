import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") {
    redirect("/login");
  }

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
      accent: "border-l-blue-500",
      empty: activeMembers.value === 0,
    },
    {
      label: "Payments this month",
      value: paymentsMonthRes.sum == null ? "—" : `₹${fmtInr(paymentsMonthRes.sum)}`,
      sub:
        paymentsMonthRes.count == null
          ? paymentsMonthRes.error ?? "unavailable"
          : `${paymentsMonthRes.count} payment${paymentsMonthRes.count === 1 ? "" : "s"}`,
      accent: "border-l-emerald-500",
      empty: paymentsMonthRes.count === 0,
    },
    {
      label: "Attendance (7 days)",
      value: attendance7d.value == null ? "—" : String(attendance7d.value),
      sub: attendance7d.error ?? "check-ins",
      accent: "border-l-violet-500",
      empty: attendance7d.value === 0,
    },
    {
      label: "Open activity bookings",
      value: openBookings.value == null ? "—" : String(openBookings.value),
      sub: openBookings.error ?? "booked / confirmed / pending",
      accent: "border-l-orange-500",
      empty: openBookings.value === 0,
    },
  ];

  const isAllEmpty = kpis.every((k) => k.empty) && stageEntries.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-yellow-500">Analytics</h1>
          <p className="text-zinc-400 mt-1">
            Live KPIs from members, leads, payments, attendance, and bookings
          </p>
        </div>
        <Link
          href="/owner/dashboard"
          className="inline-flex items-center justify-center bg-zinc-800 text-yellow-500 font-bold px-4 py-2 rounded hover:bg-zinc-700 transition-colors text-sm"
        >
          ← Dashboard
        </Link>
      </div>

      {isAllEmpty ? (
        <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl">
          <h2 className="text-xl font-bold text-yellow-500 mb-2">No Analytics Data Yet</h2>
          <p className="text-zinc-400 mb-6 max-w-md mx-auto">
            Analytics will appear here once you add members and record payments. Start building your gym community today.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/owner/members"
              className="bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-bold py-2 px-4 rounded transition-colors"
            >
              Add Members
            </Link>
            <Link
              href="/owner/payments"
              className="bg-zinc-800 hover:bg-zinc-700 text-yellow-500 border border-zinc-700 font-bold py-2 px-4 rounded transition-colors"
            >
              Record Payments
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {kpis.map((k) => (
              <div
                key={k.label}
                className={`bg-zinc-900 border border-zinc-800 rounded-lg p-4 shadow-xl border-l-4 ${k.accent}`}
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {k.label}
                </div>
                <div className="mt-2 text-2xl font-bold text-yellow-500">{k.value}</div>
                {k.sub && <div className="mt-1 text-sm text-zinc-400">{k.sub}</div>}
              </div>
            ))}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="text-base font-bold text-yellow-500">Leads by stage</h2>
            </div>
            <div className="p-5">
              {leadsRowsRes.error ? (
                <div className="text-center py-6">
                  <div className="font-bold text-yellow-500">Could not load leads</div>
                  <div className="text-zinc-400 mt-1 text-sm">{leadsRowsRes.error}</div>
                </div>
              ) : stageEntries.length === 0 ? (
                <div className="text-center py-6">
                  <div className="font-bold text-yellow-500">No leads yet</div>
                  <div className="text-zinc-400 mt-1 text-sm">
                    Stage breakdown will appear once CRM has data.{" "}
                    <Link
                      href="/owner/leads"
                      className="font-bold text-yellow-500 underline hover:text-yellow-400"
                    >
                      Open CRM →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {stageEntries.map(([stage, count]) => (
                    <div
                      key={stage}
                      className="flex justify-between items-center px-3 py-2.5 rounded-md border border-zinc-800 bg-zinc-950/60 text-sm"
                    >
                      <span className="font-semibold capitalize text-zinc-200">{stage}</span>
                      <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-bold bg-yellow-500/15 text-yellow-500 border border-yellow-500/30">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="text-base font-bold text-yellow-500">Quick links</h2>
            </div>
            <div className="p-5 flex flex-wrap gap-2">
              {[
                { href: "/owner/members", label: "Members" },
                { href: "/owner/payments", label: "Payments" },
                { href: "/owner/attendance", label: "Attendance" },
                { href: "/owner/leads", label: "CRM" },
                { href: "/owner/activities", label: "Activities" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center justify-center bg-zinc-800 text-yellow-500 font-bold px-3 py-1.5 rounded text-sm hover:bg-zinc-700 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
