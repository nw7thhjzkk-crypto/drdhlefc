import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { markNotificationRead, sendNotification } from "./actions";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notifications" };

export default async function TrainerNotificationsPage() {
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

  // Get trainer ID
  const { data: trainer } = await supabase
    .from("trainers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  // Fetch members assigned to this trainer
  let assignedMembers: { id: string; name: string; profile_id: string }[] = [];
  if (trainer) {
    const { data: assignments } = await supabase
      .from("member_trainers")
      .select("members(id, name, profile_id, status)")
      .eq("trainer_id", trainer.id)
      .is("unassigned_at", null);

    if (assignments) {
      // Supabase can return arrays or objects for joined relations. In this 1:1 context we expect an object or an array with 1 item.
      assignedMembers = assignments
        .map((a) => Array.isArray(a.members) ? a.members[0] : a.members)
        .filter((m): m is NonNullable<typeof m> => Boolean(m && m.profile_id && m.status === "active"))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  }

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
        <Link href="/trainer/dashboard" style={{ fontSize: "0.75rem", color: "var(--color-gold)", textDecoration: "none" }}>
          ← Back
        </Link>
      </div>

      {/* Compose Form */}

      <div style={{ ...cardStyle, marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", margin: "0 0 1rem 0" }}>Compose New</h2>
        <form action={sendNotification} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-silver)", marginBottom: "0.25rem" }}>Recipient</label>
            <select
              name="recipient_profile_id"
              required
              style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--radius-md)", padding: "0.5rem", color: "#fff", fontSize: "0.875rem" }}
            >
              <option value="">Select an assigned member...</option>
              {assignedMembers.map((member) => (
                <option key={member.id} value={member.profile_id}>
                  {member.name}
                </option>
              ))}
            </select>
            {assignedMembers.length === 0 && (
              <p className="mt-2 text-xs text-yellow-600 font-medium">
                You currently have no members assigned to you.
              </p>
            )}
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-silver)", marginBottom: "0.25rem" }}>Title</label>
            <input
              type="text"
              name="title"
              required
              placeholder="Notification subject..."
              style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--radius-md)", padding: "0.5rem", color: "#fff", fontSize: "0.875rem" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-silver)", marginBottom: "0.25rem" }}>Message Body</label>
            <textarea
              name="body"
              required
              rows={4}
              placeholder="Write your message here..."
              style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--radius-md)", padding: "0.5rem", color: "#fff", fontSize: "0.875rem" }}
            ></textarea>
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              background: "var(--color-gold)",
              color: "#000",
              fontWeight: 700,
              padding: "0.625rem",
              borderRadius: "var(--radius-md)",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
              marginTop: "0.5rem"
            }}
          >
            Send Notification
          </button>
        </form>
      </div>

      {(!notifications || notifications.length === 0) ? (
        <div className="py-12 text-center bg-zinc-900 border border-zinc-800 rounded-lg">
          <p className="text-zinc-500 mb-4">No notifications yet.</p>
          <span className="bg-zinc-800 text-yellow-500 font-bold px-4 py-2 rounded border border-zinc-700 inline-block">
            Inbox Empty
          </span>
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
