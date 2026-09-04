import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function TrainerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Resolve trainer from auth — never trust client-supplied ID
  const { data: trainer } = await supabase
    .from("trainers")
    .select("id, name")
    .eq("profile_id", user.id)
    .single();

  if (!trainer) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <div className="empty-state-title">Trainer profile not found</div>
        <div className="empty-state-body">Contact the gym administrator to set up your trainer account.</div>
      </div>
    );
  }

  const today    = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const tomorrow = new Date(today.getTime() + 86400000).toISOString().split("T")[0];
  const nowISO   = today.toISOString();

  const [
    { count: assignedCount },
    { data: assignedMembers },
    { data: recentAssessments },
    { count: todayAttendance },
    { data: pendingPlans },
    { data: upcomingActivities },
  ] = await Promise.all([
    // Count active assignments
    supabase
      .from("member_trainers")
      .select("*", { count: "exact", head: true })
      .eq("trainer_id", trainer.id)
      .is("unassigned_at", null),

    // Assigned member list (for quick access)
    supabase
      .from("member_trainers")
      .select("member_id, members(id, name, member_code, status, primary_goal)")
      .eq("trainer_id", trainer.id)
      .is("unassigned_at", null)
      .limit(8),

    // Recent assessments by this trainer
    supabase
      .from("assessments")
      .select("id, recorded_at, weight_kg, bmi, members(name)")
      .eq("recorded_by", user.id)
      .order("recorded_at", { ascending: false })
      .limit(5),

    // Today's attendance for assigned members
    supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .eq("trainer_id", trainer.id)
      .gte("occurred_at", todayStr)
      .lt("occurred_at", tomorrow),

    // Pending diet/workout plan recommendations
    supabase
      .from("member_diet_plans")
      .select("id, member_id, members(name), diet_plans(name)")
      .eq("status", "pending")
      .in(
        "member_id",
        (assignedMembers ?? []).map((a: { member_id: string }) => a.member_id)
      )
      .limit(5),

    // Upcoming activities for this trainer
    supabase
      .from("group_activities")
      .select("id, name, start_at, capacity")
      .eq("trainer_id", trainer.id)
      .is("deleted_at", null)
      .gte("start_at", nowISO)
      .order("start_at", { ascending: true })
      .limit(4),
  ]);

  const cardStyle: React.CSSProperties = {
    background: "var(--color-bg-card)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "var(--radius-lg)",
    padding: "1.25rem",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.6875rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--color-silver-dark)",
    marginBottom: "0.25rem",
  };

  const valueStyle: React.CSSProperties = {
    fontSize: "2rem",
    fontWeight: 800,
    color: "var(--color-gold)",
    lineHeight: 1,
  };

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto" }}>
      {/* Greeting */}
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff" }}>
          Welcome, {trainer.name}
        </h1>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-silver-dark)", marginTop: "0.2rem" }}>
          {today.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <div style={cardStyle}>
          <div style={labelStyle}>Members</div>
          <div style={valueStyle}>{assignedCount ?? 0}</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Today</div>
          <div style={valueStyle}>{todayAttendance ?? 0}</div>
          <div style={{ fontSize: "0.625rem", color: "var(--color-silver-dark)", marginTop: "0.125rem" }}>check-ins</div>
        </div>
        <div style={cardStyle}>
          <div style={labelStyle}>Pending</div>
          <div style={valueStyle}>{pendingPlans?.length ?? 0}</div>
          <div style={{ fontSize: "0.625rem", color: "var(--color-silver-dark)", marginTop: "0.125rem" }}>recommendations</div>
        </div>
      </div>

      {/* Assigned members */}
      <div style={{ ...cardStyle, marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#fff" }}>My Members</h2>
          <Link href="/trainer/members" style={{ fontSize: "0.75rem", color: "var(--color-gold)" }}>View all →</Link>
        </div>
        {assignedMembers && assignedMembers.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {(assignedMembers as AssignedMember[]).map((a) => (
              <Link
                key={a.member_id}
                href={`/trainer/members/${a.member_id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.625rem 0.75rem",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "var(--radius-md)",
                  textDecoration: "none",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#fff" }}>
                    {a.members?.name}
                  </div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--color-silver-dark)" }}>
                    {a.members?.member_code} · {a.members?.primary_goal ?? "No goal set"}
                  </div>
                </div>
                <span style={{ fontSize: "0.6875rem", color: "var(--color-gold)" }}>→</span>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "0.875rem", color: "var(--color-silver-dark)", textAlign: "center", padding: "1rem 0" }}>
            No members assigned yet.
          </p>
        )}
      </div>

      {/* Recent assessments */}
      <div style={{ ...cardStyle, marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#fff", marginBottom: "0.75rem" }}>
          Recent Assessments
        </h2>
        {recentAssessments && recentAssessments.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {(recentAssessments as Assessment[]).map((a) => (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.5rem 0",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  fontSize: "0.8125rem",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: "#fff" }}>{a.members?.name}</div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--color-silver-dark)" }}>
                    {new Date(a.recorded_at).toLocaleDateString("en-IN")}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "var(--color-gold)", fontWeight: 700 }}>{a.weight_kg} kg</div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--color-silver-dark)" }}>BMI {a.bmi ?? "—"}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "0.875rem", color: "var(--color-silver-dark)", textAlign: "center", padding: "0.75rem 0" }}>
            No assessments recorded yet.
          </p>
        )}
        <Link
          href="/trainer/members"
          style={{
            display: "block",
            textAlign: "center",
            marginTop: "0.75rem",
            fontSize: "0.75rem",
            color: "var(--color-gold)",
          }}
        >
          + Add assessment for a member
        </Link>
      </div>

      {/* Upcoming activities */}
      {upcomingActivities && upcomingActivities.length > 0 && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#fff", marginBottom: "0.75rem" }}>
            My Upcoming Activities
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {(upcomingActivities as GroupActivity[]).map((act) => (
              <div
                key={act.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.5rem 0",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  fontSize: "0.8125rem",
                }}
              >
                <div style={{ fontWeight: 600, color: "#fff" }}>{act.name}</div>
                <div style={{ fontSize: "0.6875rem", color: "var(--color-gold)" }}>
                  {new Date(act.start_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Types
interface AssignedMember {
  member_id: string;
  members: { id: string; name: string; member_code: string; status: string; primary_goal: string | null } | null;
}
interface Assessment {
  id: string;
  recorded_at: string;
  weight_kg: number | null;
  bmi: number | null;
  members: { name: string } | null;
}
interface GroupActivity {
  id: string;
  name: string;
  start_at: string;
  capacity: number | null;
}
