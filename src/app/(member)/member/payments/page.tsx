import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payments" };

interface PaymentRow {
  id: string;
  amount: number | string;
  method: string | null;
  reference: string | null;
  notes: string | null;
  paid_at: string | null;
}

interface MembershipRow {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  total_amount: number | string;
  paid_amount: number | string;
  pending_amount: number | string;
  membership_plans: { name: string } | { name: string }[] | null;
}

function planName(plans: MembershipRow["membership_plans"]): string {
  if (!plans) return "Membership";
  if (Array.isArray(plans)) return plans[0]?.name ?? "Membership";
  return plans.name ?? "Membership";
}

function formatINR(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return "₹0";
  return `₹${n.toLocaleString("en-IN")}`;
}

export default async function MemberPaymentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("members")
    .select("id, name")
    .eq("profile_id", user.id)
    .single();

  if (!member) {
    return (
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <div className="empty-state-title">Member profile not found</div>
          <div className="empty-state-body">
            Contact the gym front desk to set up your account.
          </div>
        </div>
      </div>
    );
  }

  const [{ data: membership }, { data: payments }] = await Promise.all([
    supabase
      .from("memberships")
      .select(
        "id, start_date, end_date, status, total_amount, paid_amount, pending_amount, membership_plans(name)",
      )
      .eq("member_id", member.id)
      .in("status", ["active", "pending_payment", "expired"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("payments")
      .select("id, amount, method, reference, notes, paid_at")
      .eq("member_id", member.id)
      .order("paid_at", { ascending: false })
      .limit(50),
  ]);

  const m = membership as MembershipRow | null;
  const paymentRows = (payments ?? []) as PaymentRow[];

  let daysLeft: number | null = null;
  if (m?.end_date) {
    const endKey = String(m.end_date).slice(0, 10);
    const now = new Date();
    const todayKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
    const [ey, em, ed] = endKey.split("-").map(Number);
    const [ty, tm, td] = todayKey.split("-").map(Number);
    daysLeft = Math.round(
      (Date.UTC(ey, em - 1, ed) - Date.UTC(ty, tm - 1, td)) / 86400000,
    );
  }

  const card: React.CSSProperties = {
    background: "var(--color-bg-card)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "var(--radius-lg)",
    padding: "1rem 1.125rem",
    marginBottom: "0.875rem",
  };

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff" }}>
          Payments
        </h1>
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-silver-dark)",
            marginTop: "0.2rem",
          }}
        >
          Membership status and your payment history
        </p>
      </div>

      <div
        style={{
          ...card,
          borderLeft: m ? "3px solid var(--color-gold)" : "3px solid #EF4444",
        }}
      >
        <div
          style={{
            fontSize: "0.6875rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-silver-dark)",
            marginBottom: "0.5rem",
          }}
        >
          Current membership
        </div>
        {m ? (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "0.75rem",
              }}
            >
              <div>
                <div
                  style={{ fontWeight: 700, color: "#fff", fontSize: "1rem" }}
                >
                  {planName(m.membership_plans)}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-silver-dark)",
                    marginTop: "0.25rem",
                  }}
                >
                  {new Date(m.start_date).toLocaleDateString("en-IN")} –{" "}
                  {new Date(m.end_date).toLocaleDateString("en-IN")}
                </div>
              </div>
              <span
                className={`badge ${
                  daysLeft !== null && daysLeft <= 7
                    ? "badge-danger"
                    : daysLeft !== null && daysLeft <= 30
                      ? "badge-warning"
                      : "badge-success"
                }`}
              >
                {daysLeft !== null ? `${daysLeft}d left` : m.status}
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "0.5rem",
                marginTop: "0.875rem",
              }}
            >
              <AmountStat label="Total" value={formatINR(m.total_amount)} />
              <AmountStat label="Paid" value={formatINR(m.paid_amount)} />
              <AmountStat
                label="Due"
                value={formatINR(m.pending_amount)}
                emphasize={Number(m.pending_amount) > 0}
              />
            </div>
          </div>
        ) : (
          <p style={{ fontSize: "0.875rem", color: "#EF4444" }}>
            No membership on file. Contact the front desk.
          </p>
        )}
      </div>

      <div style={card}>
        <h2
          style={{
            fontSize: "0.875rem",
            fontWeight: 700,
            color: "#fff",
            marginBottom: "0.75rem",
          }}
        >
          Payment history
        </h2>
        {paymentRows.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.625rem",
            }}
          >
            {paymentRows.map((p) => (
              <div
                key={p.id}
                style={{
                  padding: "0.625rem 0.75rem",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      color: "var(--color-gold)",
                      fontSize: "0.9375rem",
                    }}
                  >
                    {formatINR(p.amount)}
                  </div>
                  <span
                    className="badge badge-success"
                    style={{ fontSize: "0.625rem" }}
                  >
                    {p.method ?? "paid"}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "0.6875rem",
                    color: "var(--color-silver-dark)",
                    marginTop: "0.25rem",
                  }}
                >
                  {p.paid_at
                    ? new Date(p.paid_at).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "Date unknown"}
                  {p.reference ? ` · Ref ${p.reference}` : ""}
                </div>
                {p.notes ? (
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-silver)",
                      marginTop: "0.25rem",
                    }}
                  >
                    {p.notes}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-10 text-center">
            <h3 className="text-lg font-semibold text-yellow-500">
              No payments yet
            </h3>
            <p className="max-w-md text-sm text-zinc-500">
              No payments have been recorded for your account. Once the front
              desk logs a payment, it will show up here.
            </p>
            <span className="bg-zinc-800 text-yellow-500 font-bold px-4 py-2 rounded border border-zinc-700 inline-block">
              Waiting
            </span>
          </div>
        )}
      </div>

      <p
        style={{
          fontSize: "0.75rem",
          color: "var(--color-silver-dark)",
          textAlign: "center",
        }}
      >
        Need a receipt? Ask the front desk.{" "}
        <Link href="/member/home" style={{ color: "var(--color-gold)" }}>
          Back to home
        </Link>
      </p>
    </div>
  );
}

function AmountStat({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: "0.625rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--color-silver-dark)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "0.9375rem",
          fontWeight: 800,
          color: emphasize ? "#EAB308" : "#fff",
          marginTop: "0.2rem",
        }}
      >
        {value}
      </div>
    </div>
  );
}
