import { createClient } from "@/utils/supabase/server";
import React from "react";
import { redirect } from "next/navigation";

// Types
interface Payment {
  id: string;
  amount: number;
  method: string | null;
  reference: string | null;
  paid_at: string;
}

interface Membership {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  pending_amount: number;
  total_amount: number;
  paid_amount: number;
  membership_plans: { name: string } | null;
}

export default async function MemberPaymentsPage() {
  const supabase = await createClient();

  // 1. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Fetch member profile
  const { data: member } = await supabase
    .from("members")
    .select("id, name")
    .eq("profile_id", user.id)
    .single();

  if (!member) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 text-center text-red-500">
        Member profile not found.
      </div>
    );
  }

  // 3. Fetch active or pending membership
  const { data: rawMembership } = await supabase
    .from("memberships")
    .select(`
      id,
      status,
      start_date,
      end_date,
      pending_amount,
      total_amount,
      paid_amount,
      membership_plans (
        name
      )
    `)
    .eq("member_id", member.id)
    .in("status", ["active", "pending_payment"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Treat 'unknown' to specific type
  const membership = rawMembership as unknown as Membership | null;

  // 4. Fetch all payments for this member
  const { data: rawPayments } = await supabase
    .from("payments")
    .select(`
      id,
      amount,
      method,
      reference,
      paid_at
    `)
    .eq("member_id", member.id)
    .order("paid_at", { ascending: false });

  const payments = (rawPayments || []) as unknown as Payment[];

  const cardStyle: React.CSSProperties = {
    background: "var(--color-bg-card)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "var(--radius-lg)",
    padding: "1rem 1.125rem",
    marginBottom: "0.875rem",
  };

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "1rem" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff" }}>
          Payments & Membership
        </h1>
      </div>

      {/* Membership Status Card */}
      <div style={{ ...cardStyle, borderLeft: membership ? "3px solid var(--color-gold)" : "3px solid #EF4444" }}>
        <div style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-silver-dark)", marginBottom: "0.5rem" }}>
          Current Membership
        </div>
        {membership ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
              <div>
                <div style={{ fontWeight: 700, color: "#fff", fontSize: "1rem" }}>
                  {membership.membership_plans?.name ?? "Active Plan"}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-silver-dark)", marginTop: "0.25rem" }}>
                  Valid: {new Date(membership.start_date).toLocaleDateString("en-IN")} – {new Date(membership.end_date).toLocaleDateString("en-IN")}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className={`badge ${membership.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                  {membership.status}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <div>
                <div style={{ fontSize: "0.6875rem", color: "var(--color-silver-dark)" }}>Total</div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#fff" }}>₹{Number(membership.total_amount).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.6875rem", color: "var(--color-silver-dark)" }}>Paid</div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#4ADE80" }}>₹{Number(membership.paid_amount).toLocaleString()}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.6875rem", color: "var(--color-silver-dark)" }}>Pending</div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: membership.pending_amount > 0 ? "#EAB308" : "var(--color-silver)" }}>
                  ₹{Number(membership.pending_amount).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: "0.875rem", color: "#EF4444" }}>No active membership found.</p>
        )}
      </div>

      {/* Payment History List */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#fff", marginBottom: "0.75rem" }}>
          Payment History
        </h2>
        {payments.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {payments.map((payment) => (
              <div
                key={payment.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.75rem",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: "#fff", fontSize: "0.875rem" }}>
                    ₹{Number(payment.amount).toLocaleString()}
                  </div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--color-silver-dark)", marginTop: "0.125rem", textTransform: "capitalize" }}>
                    {payment.method || "Cash"}
                    {payment.reference && ` · Ref: ${payment.reference}`}
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--color-silver)" }}>
                  {new Date(payment.paid_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "0.875rem", color: "var(--color-silver-dark)", textAlign: "center", padding: "0.75rem 0" }}>
            No payments recorded yet.
          </p>
        )}
      </div>
    </div>
  );
}
