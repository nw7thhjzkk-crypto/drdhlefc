import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { bookActivityAction, cancelBookingAction } from "./actions";

export default async function ActivitiesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "member") {
    redirect("/login");
  }

  // activity_bookings.member_id FKs to members.id (not profiles.id).
  // Live book_activity_for_member resolves members via profile_id = auth.uid().
  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!member) {
    return (
      <div style={{ maxWidth: "480px", margin: "0 auto", paddingBottom: "5rem" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff" }}>
          All Activities
        </h1>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-silver-dark)",
            marginTop: "0.75rem",
          }}
        >
          Member profile not found. Ask the gym owner to link your account.
        </p>
      </div>
    );
  }

  const nowISO = new Date().toISOString();

  // Live group_activities has status (no deleted_at column).
  const [{ data: upcomingActivities }, { data: myBookings }] = await Promise.all([
    supabase
      .from("group_activities")
      .select("id, name, start_at, duration_minutes, location, capacity, trainer_id")
      .eq("status", "active")
      .gte("start_at", nowISO)
      .order("start_at", { ascending: true }),

    supabase
      .from("activity_bookings")
      .select("id, activity_id, status")
      .eq("member_id", member.id)
      .eq("status", "booked"),
  ]);

  const bookedActivityIds = new Set((myBookings || []).map((b) => b.activity_id));
  const myBookingMap = (myBookings || []).reduce((acc: Record<string, string>, b) => {
    acc[b.activity_id] = b.id;
    return acc;
  }, {});

  const card: React.CSSProperties = {
    background: "var(--color-bg-card)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "var(--radius-lg)",
    padding: "1rem 1.125rem",
    marginBottom: "0.875rem",
  };

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", paddingBottom: "5rem" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff" }}>
          All Activities
        </h1>
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-silver-dark)",
            marginTop: "0.2rem",
          }}
        >
          Browse and book upcoming sessions.
        </p>
      </div>

      <div style={card}>
        {upcomingActivities && upcomingActivities.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {upcomingActivities.map((act) => {
              const alreadyBooked = bookedActivityIds.has(act.id);
              const bookingId = myBookingMap[act.id];
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
                    border: `1px solid ${
                      alreadyBooked
                        ? "rgba(201,168,76,0.3)"
                        : "rgba(255,255,255,0.05)"
                    }`,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: alreadyBooked ? "var(--color-gold)" : "#fff",
                        fontSize: "0.875rem",
                      }}
                    >
                      {act.name}
                      {alreadyBooked && (
                        <span style={{ marginLeft: "0.4rem", fontSize: "0.6875rem" }}>
                          ✓ Booked
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "0.6875rem",
                        color: "var(--color-silver-dark)",
                        marginTop: "0.125rem",
                      }}
                    >
                      {new Date(act.start_at).toLocaleDateString("en-IN", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                      {" · "}
                      {new Date(act.start_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {act.location ? ` · ${act.location}` : ""}
                    </div>
                  </div>
                  {alreadyBooked ? (
                    <form
                      action={async () => {
                        "use server";
                        await cancelBookingAction(bookingId);
                      }}
                    >
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
                    <form
                      action={async () => {
                        "use server";
                        await bookActivityAction(act.id);
                      }}
                    >
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
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-silver-dark)",
              textAlign: "center",
              padding: "0.75rem 0",
            }}
          >
            No upcoming activities scheduled.
          </p>
        )}
      </div>
    </div>
  );
}
