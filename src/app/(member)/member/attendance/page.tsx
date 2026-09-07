import { createClient } from "@/utils/supabase/server";
import CheckInButton from "../home/CheckInButton";

export default async function MemberAttendancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div>Not authenticated</div>;

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!member) return <div style={{ color: "white" }}>Member profile not found</div>;

  const { data: attendanceRecords } = await supabase
    .from("attendance")
    .select("id, occurred_at, method")
    .eq("member_id", member.id)
    .order("occurred_at", { ascending: false });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const hasCheckedInToday = attendanceRecords
    ? attendanceRecords.some((a) => new Date(a.occurred_at) >= todayStart)
    : false;

  const hasRecords = !!(attendanceRecords && attendanceRecords.length > 0);

  const cardStyle: React.CSSProperties = {
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
          Attendance History
        </h1>
      </div>

      <div style={cardStyle}>
        {hasRecords ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {attendanceRecords!.map((a, i) => (
              <div key={a.id} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", paddingBottom: i === attendanceRecords!.length - 1 ? 0 : "1rem", borderBottom: i === attendanceRecords!.length - 1 ? "none" : "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#fff" }}>
                      {new Date(a.occurred_at).toLocaleDateString("en-IN", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                   </div>
                   <div style={{ fontSize: "0.6875rem", color: "var(--color-silver-dark)", textTransform: "capitalize" }}>
                      {new Date(a.occurred_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                   </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-silver-dark)" }}>
                    Method: {a.method ?? "manual"}
                  </div>
                  <span className="badge badge-success" style={{ fontSize: "0.625rem" }}>Present</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-10 text-center">
            <h3 className="text-lg font-semibold text-yellow-500">
              No attendance yet
            </h3>
            <p className="max-w-md text-sm text-zinc-500">
              Check in when you arrive at the gym. Your visit history will show up here.
            </p>
          </div>
        )}

        <CheckInButton hasCheckedInToday={hasCheckedInToday} />
      </div>
    </div>
  );
}
