import { createClient } from "@/utils/supabase/server";

export default async function MemberAssessmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div>Not authenticated</div>;

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!member) return <div style={{ color: "white" }}>Member profile not found</div>;

  const { data: assessments } = await supabase
    .from("assessments")
    .select("id, recorded_at, height_cm, weight_kg, body_fat_pct, bmi, source")
    .eq("member_id", member.id)
    .order("recorded_at", { ascending: false });

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
          Assessment History
        </h1>
      </div>

      <div style={cardStyle}>
        {assessments && assessments.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {assessments.map((a, i) => (
              <div key={a.id} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", paddingBottom: i === assessments.length - 1 ? 0 : "1rem", borderBottom: i === assessments.length - 1 ? "none" : "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#fff" }}>
                      {new Date(a.recorded_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                   </div>
                   <div style={{ fontSize: "0.6875rem", color: "var(--color-silver-dark)", textTransform: "capitalize" }}>
                      Source: {a.source}
                   </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", textAlign: "center" }}>
                  <Stat label="Weight" value={a.weight_kg ? `${a.weight_kg} kg` : "—"} />
                  <Stat label="Height" value={a.height_cm ? `${a.height_cm} cm` : "—"} />
                  <Stat label="BMI" value={a.bmi ? String(a.bmi) : "—"} />
                  <Stat label="Body Fat" value={a.body_fat_pct ? `${a.body_fat_pct}%` : "—"} />
                </div>
              </div>
            ))}
          </div>
        ) : (
           <p style={{ fontSize: "0.875rem", color: "var(--color-silver-dark)", textAlign: "center", padding: "0.75rem 0" }}>
            No assessments recorded yet.
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-silver-dark)" }}>
        {label}
      </div>
      <div style={{ fontSize: "0.875rem", fontWeight: 800, color: "var(--color-gold)", marginTop: "0.2rem" }}>
        {value}
      </div>
    </div>
  );
}
