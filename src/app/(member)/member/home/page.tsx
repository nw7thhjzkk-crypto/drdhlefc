import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { bookActivity, cancelBooking } from "./actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Home" };

export default async function MemberHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Derive member from auth.uid() — never trust client-supplied member_id
  const { data: member } = await supabase
    .from("members")
    .select("id, name, member_code, primary_goal, status")
    .eq("profile_id", user.id)
    .single();

  if (!member) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <div className="empty-state-title">Member profile not found</div>
        <div className="empty-state-body">Contact the gym front desk to set up your account.</div>
      </div>
    );
  }

  const nowISO = new Date().toISOString();

  const [
    { data: latestAssessment },
    { data: membership },
    { data: upcomingActivities },
    { data: myBookings },
    { data: myAttendance },
    { data: pendingDiet },
    { data: pendingWorkout },
  ] = await Promise.all([
    supabase
      .from("assessments")
      .select("weight_kg, bmi, body_fat_pct, recorded_at")
      .eq("member_id", member.id)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("memberships")
      .select("end_date, status, total_amount, paid_amount, pending_amount, membership_plans(name)")
      .eq("member_id", member.id)
      .in("status", ["active", "pending_payment"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("group_activities")
      .select("id, name, start_at, duration_minutes, location, capacity, trainer_id")
      .is("deleted_at", null)
      .eq("status", "active")
      .gte("start_at", nowISO)
      .order("start_at", { ascending: true })
      .limit(6),

    supabase
      .from("activity_bookings")
      .select("id, activity_id, status")
      .eq("member_id", member.id)
      .eq("status", "booked"),

    supabase
      .from("attendance")
      .select("occurred_at, method")
      .eq("member_id", member.id)
      .order("occurred_at", { ascending: false })
      .limit(5),

    supabase
      .from("member_diet_plans")
      .select("id, diet_plans(name)")
      .eq("member_id", member.id)
      .eq("status", "pending")
      .limit(3),

    supabase
      .from("member_workout_plans")
      .select("id, workout_plans(name)")
      .eq("member_id", member.id)
      .eq("status", "pending")
      .limit(3),
  ]);

  const bookedActivityIds = new Set((myBookings ?? []).map((b: { activity_id: string }) => b.activity_id));
  const myBookingMap = Object.fromEntries((myBookings ?? []).map((b: { activity_id: string; id: string }) => [b.activity_id, b.id]));

  let daysLeft: number | null = null;
  if (membership?.end_date) {
    const endKey = String(membership.end_date).slice(0, 10);
    const now = new Date();
    const todayKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
    const [ey, em, ed] = endKey.split("-").map(Number);
    const [ty, tm, td] = todayKey.split("-").map(Number);
    daysLeft = Math.round((Date.UTC(ey, em - 1, ed) - Date.UTC(ty, tm - 1, td)) / 86400000);
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
          Hey, {member.name?.split(" ")[0]} 👋
        </h1>
        {member.primary_goal && (
          <p style={{ fontSize: "0.8125rem", color: "var(--color-silver-dark)", marginTop: "0.2rem" }}>
            Goal: {member.primary_goal}
          </p>
        )}
      </div>

      <div style={{ ...card, borderLeft: membership ? "3px solid var(--color-gold)" : "3px solid #EF4444" }}>
        <div style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-silver-dark)", marginBottom: "0.5rem" }}>
          Membership
        </div>
        {membership ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 700, color: "#fff", fontSize: "1rem" }}>
                {(membership.membership_plans as unknown as { name: string } | null)?.name ?? "Active Plan"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-silver-dark)", marginTop: "0.25rem" }}>
                Valid until {new Date(membership.end_date).toLocaleDateString("en-IN")}
              </div>
              {membership.pending_amount > 0 && (
                <div style={{ fontSize: "0.75rem", color: "#EAB308", marginTop: "0.2rem" }}>
                  ₹{Number(membership.pending_amount).toLocaleString()} pending
                </div>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <span className={`badge ${daysLeft !== null && daysLeft <= 7 ? "badge-danger" : daysLeft !== null && daysLeft <= 30 ? "badge-warning" : "badge-success"}`}>
                {daysLeft !== null ? `${daysLeft}d left` : membership.status}
              </span>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: "0.875rem", color: "#EF4444" }}>No active membership. Contact the front desk.</p>
        )}
      </div>

      {latestAssessment && (
        <div style={{ ...card, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
          <Stat label="Weight"   value={`${latestAssessment.weight_kg} kg`} />
          <Stat label="BMI"      value={latestAssessment.bmi ? String(latestAssessment.bmi) : "—"} />
          <Stat label="Body fat" value={latestAssessment.body_fat_pct ? `${latestAssessment.body_fat_pct}%` : "—"} />
        </div>
      )}

      {((pendingDiet?.length ?? 0) + (pendingWorkout?.length ?? 0)) > 0 && (
        <div style={{ ...card, borderLeft: "3px solid #8B5CF6" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8B5CF6", marginBottom: "0.5rem" }}>
            📋 Pending Recommendations
          </div>
          {(pendingDiet ?? []).map((r: PendingPlan) => (
            <div key={r.id} style={{ fontSize: "0.8125rem", color: "var(--color-silver)", marginBottom: "0.25rem" }}>
              🥗 {(r.diet_plans as unknown as { name: string } | null)?.name}
              <Link href="/member/diet" style={{ marginLeft: "0.5rem", fontSize: "0.6875rem", color: "var(--color-gold)" }}>Review →</Link>
            </div>
          ))}
          {(pendingWorkout ?? []).map((r: PendingWorkoutPlan) => (
            <div key={r.id} style={{ fontSize: "0.8125rem", color: "var(--color-silver)", marginBottom: "0.25rem" }}>
              💪 {(r.workout_plans as unknown as { name: string } | null)?.name}
              <Link href="/member/workout" style={{ marginLeft: "0.5rem", fontSize: "0.6875rem", color: "var(--color-gold)" }}>Review →</Link>
            </div>
          ))}
        </div>
      )}

      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#fff" }}>Upcoming Activities</h2>
        </div>
        {upcomingActivities && upcomingActivities.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {(upcomingActivities as GroupActivity[]).map((act) => {
              const alreadyBooked = bookedActivityIds.has(act.id);
              const bookingId     = myBookingMap[act.id] as string | undefined;
              return (
                <div
                  key={act.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.625rem 0.75rem",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: "var(--radius-md)",
                    border: `1px solid ${alreadyBooked ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.05)"}`,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: alreadyBooked ? "var(--color-gold)" : "#fff", fontSize: "0.875rem" }}>
                      {act.name}
                      {alreadyBooked && <span style={{ marginLeft: "0.4rem", fontSize: "0.6875rem" }}>✓ Booked</span>}
                    </div>
                    <div style={{ fontSize: "0.6875rem", color: "var(--color-silver-dark)", marginTop: "0.125rem" }}>
                      {new Date(act.start_at).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                      {" · "}{new Date(act.start_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      {act.location ? ` · ${act.location}` : ""}
                    </div>
                  </div>
                  {alreadyBooked ? (
                    <form action={async () => { "use server"; await cancelBooking(bookingId!); }}>
                      <button
                        type="submit"
                        style={{
                          fontSize: "0.6875rem",
                          padding: "0.25rem 0.6rem",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid rgba(239,68,68,0.5)",
                          background: "transparent",
                          color: "#EF4444",
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <form action={async () => { "use server"; await bookActivity(act.id); }}>
                      <button
                        type="submit"
                        style={{
                          fontSize: "0.6875rem",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--color-gold)",
                          background: "transparent",
                          color: "var(--color-gold)",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Book
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ fontSize: "0.875rem", color: "var(--color-silver-dark)", textAlign: "center", padding: "0.75rem 0" }}>
            No upcoming activities scheduled.
          </p>
        )}
      </div>

      {myAttendance && myAttendance.length > 0 && (
        <div style={card}>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#fff", marginBottom: "0.625rem" }}>
            Recent Check-ins
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {(myAttendance as Attendance[]).map((a, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem" }}>
                <span style={{ color: "var(--color-silver)" }}>
                  {new Date(a.occurred_at).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                </span>
                <span className="badge badge-success" style={{ fontSize: "0.625rem" }}>{a.method ?? "manual"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-silver-dark)" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--color-gold)", marginTop: "0.2rem" }}>
        {value}
      </div>
    </div>
  );
}

interface GroupActivity {
  id: string;
  name: string;
  start_at: string;
  duration_minutes: number | null;
  location: string | null;
  capacity: number | null;
}
interface Attendance {
  occurred_at: string;
  method: string | null;
}
interface PendingPlan {
  id: string;
  diet_plans: unknown;
}
interface PendingWorkoutPlan {
  id: string;
  workout_plans: unknown;
}
