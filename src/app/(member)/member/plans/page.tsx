import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Membership & Payments" };

export default async function MemberPlans() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch the current member ID safely
  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!member) {
    return (
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-10 text-center">
          <h3 className="text-lg font-semibold text-yellow-500">
            Member profile not found
          </h3>
          <p className="max-w-md text-sm text-zinc-500">
            Contact the gym front desk to set up your member account, then your
            memberships and payments will show here.
          </p>
        </div>
      </div>
    );
  }

  // Fetch all memberships for this member
  const { data: memberships } = await supabase
    .from("memberships")
    .select("id, start_date, end_date, total_amount, paid_amount, pending_amount, status, membership_plans(name)")
    .eq("member_id", member.id)
    .order("created_at", { ascending: false });

  // Fetch all payments for this member
  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, method, reference, paid_at, memberships(membership_plans(name))")
    .eq("member_id", member.id)
    .order("paid_at", { ascending: false });

  const card: React.CSSProperties = {
    background: "var(--color-bg-card)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "var(--radius-lg)",
    padding: "1.25rem",
    marginBottom: "1rem",
  };

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", marginBottom: "1.25rem" }}>
        Membership & Payments
      </h1>

      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-gold)", marginBottom: "0.875rem" }}>
          Memberships
        </h2>
        {memberships && memberships.length > 0 ? (
          memberships.map((ms) => {
            const planName = (ms.membership_plans as unknown as { name: string } | null)?.name ?? "Unknown Plan";
            const isActive = ms.status === "active" || ms.status === "pending_payment";
            return (
              <div
                key={ms.id}
                style={{
                  ...card,
                  borderLeft: isActive ? "3px solid var(--color-gold)" : "3px solid rgba(255,255,255,0.1)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <div style={{ fontWeight: 700, color: "#fff", fontSize: "1.125rem" }}>{planName}</div>
                  <span className={`badge ${isActive ? "badge-success" : "badge-neutral"}`}>
                    {ms.status.replace("_", " ")}
                  </span>
                </div>
                <div style={{ fontSize: "0.8125rem", color: "var(--color-silver-dark)", marginBottom: "0.75rem", display: "flex", gap: "1rem" }}>
                  <div>
                    <span style={{ display: "block", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Started</span>
                    <span style={{ color: "var(--color-silver)" }}>{new Date(ms.start_date).toLocaleDateString("en-IN")}</span>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ends</span>
                    <span style={{ color: "var(--color-silver)" }}>{new Date(ms.end_date).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", background: "rgba(0,0,0,0.2)", padding: "0.75rem", borderRadius: "var(--radius-md)" }}>
                  <div>
                    <div style={{ fontSize: "0.6875rem", color: "var(--color-silver-dark)" }}>Total</div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#fff" }}>₹{Number(ms.total_amount).toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.6875rem", color: "var(--color-silver-dark)" }}>Paid</div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#10B981" }}>₹{Number(ms.paid_amount).toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.6875rem", color: "var(--color-silver-dark)" }}>Pending</div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: ms.pending_amount > 0 ? "#EF4444" : "var(--color-silver)" }}>
                      ₹{Number(ms.pending_amount).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-8 text-center">
            <h3 className="text-lg font-semibold text-yellow-500">
              No memberships yet
            </h3>
            <p className="max-w-md text-sm text-zinc-500">
              You do not have a membership on file. Ask the front desk to assign
              a plan, then it will appear here.
            </p>
          </div>
        )}
      </div>

      <div>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-gold)", marginBottom: "0.875rem" }}>
          Payment History
        </h2>
        {payments && payments.length > 0 ? (
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {payments.map((p, i) => {
                const isLast = i === payments.length - 1;
                // Deep extraction of plan name from nested JSON
                let planName = "Membership Payment";
                if (p.memberships) {
                  const ms = p.memberships as unknown as { membership_plans?: { name: string } | { name: string }[] };
                  if (Array.isArray(ms.membership_plans) && ms.membership_plans.length > 0) {
                    planName = ms.membership_plans[0].name;
                  } else if (ms.membership_plans && !Array.isArray(ms.membership_plans)) {
                    planName = ms.membership_plans.name;
                  }
                }

                return (
                  <div
                    key={p.id}
                    style={{
                      padding: "1rem 1.125rem",
                      borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.06)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "#fff", fontSize: "0.875rem", marginBottom: "0.125rem" }}>
                        {planName}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-silver-dark)" }}>
                        {new Date(p.paid_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        {" · "}{p.method}
                        {p.reference ? ` (${p.reference})` : ""}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: "#10B981", fontSize: "1rem" }}>
                      ₹{Number(p.amount).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-8 text-center">
            <h3 className="text-lg font-semibold text-yellow-500">
              No payments yet
            </h3>
            <p className="max-w-md text-sm text-zinc-500">
              No payments have been recorded for your account. Once the front
              desk logs a payment, it will show up here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
