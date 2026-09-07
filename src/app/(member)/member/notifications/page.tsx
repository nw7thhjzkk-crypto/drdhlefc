import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { markNotificationRead } from "./actions";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notifications" };

export default async function MemberNotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, body, channel, read_at, created_at")
    .eq("recipient_profile_id", user.id)
    .order("created_at", { ascending: false });

  const cardStyle: React.CSSProperties = {
    background: "var(--color-bg-card)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "var(--radius-lg)",
    padding: "1rem 1.125rem",
    marginBottom: "0.875rem",
  };

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff" }}>Inbox</h1>
        <Link href="/member/home" style={{ fontSize: "0.75rem", color: "var(--color-gold)", textDecoration: "none" }}>
          ← Back
        </Link>
      </div>

      {(!notifications || notifications.length === 0) ? (
        <div style={{ ...cardStyle, textAlign: "center", padding: "2rem 1rem" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--color-silver)" }}>No notifications</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                ...cardStyle,
                borderLeft: notification.read_at ? "3px solid transparent" : "3px solid var(--color-gold)",
                opacity: notification.read_at ? 0.7 : 1,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#fff", margin: 0 }}>
                  {notification.title}
                </h3>
                <span style={{ fontSize: "0.625rem", color: "var(--color-silver-dark)" }}>
                  {new Date(notification.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                </span>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-silver)", margin: "0 0 0.75rem 0", whiteSpace: "pre-wrap" }}>
                {notification.body}
              </p>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="badge badge-warning" style={{ fontSize: "0.625rem", textTransform: "uppercase" }}>
                  {notification.channel}
                </span>

                {!notification.read_at && (
                  <form action={async () => {
                    "use server";
                    await markNotificationRead(notification.id);
                  }}>
                    <button
                      type="submit"
                      style={{
                        fontSize: "0.6875rem",
                        padding: "0.25rem 0.6rem",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--color-gold)",
                        background: "transparent",
                        color: "var(--color-gold)",
                        cursor: "pointer",
                      }}
                    >
                      Mark Read
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
