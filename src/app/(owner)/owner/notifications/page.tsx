import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { sendNotification } from "./actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Send Notification" };

export default async function OwnerNotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") {
    redirect("/login");
  }

  const { data: members } = await supabase
    .from("members")
    .select("id, name, profile_id")
    .eq("status", "active")
    .not("profile_id", "is", null)
    .order("name", { ascending: true });

  const { data: recentNotifications } = await supabase
    .from("notifications")
    .select("id, title, body, channel, read_at, created_at, profiles!notifications_recipient_profile_id_fkey(email)")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <h1 className="text-2xl font-bold text-yellow-500">Notifications</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Compose Form */}
        <div className="bg-zinc-900 p-6 rounded-lg shadow-xl border border-zinc-800 h-fit">
          <h2 className="text-xl font-semibold mb-6 text-zinc-200">Compose New</h2>
          <form action={sendNotification} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Recipient</label>
              <select
                name="recipient_profile_id"
                required
                className="block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:border-yellow-500"
              >
                <option value="">Select an active member...</option>
                {members?.map((member) => (
                  <option key={member.id} value={member.profile_id!}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Title</label>
              <input
                type="text"
                name="title"
                required
                placeholder="Notification subject..."
                className="block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Message Body</label>
              <textarea
                name="body"
                required
                rows={5}
                placeholder="Write your message here..."
                className="block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:border-yellow-500"
              ></textarea>
            </div>

            <button type="submit" className="w-full bg-yellow-600 text-zinc-950 font-bold px-6 py-2 rounded hover:bg-yellow-500 transition-colors shadow-lg">
              Send Notification
            </button>
          </form>
        </div>

        {/* Recent Notifications Sent */}
        <div className="bg-zinc-900 p-6 rounded-lg shadow-xl border border-zinc-800">
          <h2 className="text-xl font-semibold mb-6 text-zinc-200">Recent Sent (Global)</h2>
          {(!recentNotifications || recentNotifications.length === 0) ? (
            <p className="text-zinc-500 text-sm">No notifications have been sent yet.</p>
          ) : (
            <div className="space-y-4">
              {recentNotifications.map((notif) => (
                <div key={notif.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-zinc-200 text-sm">{notif.title}</h3>
                    <span className="text-xs text-zinc-500">
                      {new Date(notif.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-2 truncate">
                    To: {(notif.profiles as unknown as { email: string } | null)?.email || "Unknown"}
                  </p>
                  <p className="text-sm text-zinc-300 line-clamp-2 mb-3">
                    {notif.body}
                  </p>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-yellow-500">
                      {notif.channel}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${notif.read_at ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>
                      {notif.read_at ? "Read" : "Unread"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
