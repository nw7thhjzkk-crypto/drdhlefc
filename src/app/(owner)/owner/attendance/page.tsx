import { createClient } from "@/utils/supabase/server";
import { logAttendance } from "./actions";
import Link from "next/link";

type MemberOption = { id: string; name: string; member_code?: string | null };

type AttendanceRecord = {
  id: string;
  occurred_at: string;
  method: string;
  members: { name: string } | { name: string }[] | null;
};

function memberName(members: AttendanceRecord["members"]): string {
  if (!members) return "—";
  return Array.isArray(members) ? (members[0]?.name ?? "—") : members.name;
}

export default async function OwnerAttendancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div>Not authenticated</div>;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "owner") {
    return <div>Owner access required</div>;
  }

  const { data: members } = await supabase
    .from("members")
    .select("id, name, member_code")
    .order("name", { ascending: true });

  const memberList = (members as MemberOption[] | null) ?? [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: recentAttendance } = await supabase
    .from("attendance")
    .select("id, occurred_at, method, members(name)")
    .gte("occurred_at", today.toISOString())
    .order("occurred_at", { ascending: false });

  const rows = (recentAttendance as AttendanceRecord[] | null) ?? [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-yellow-500">Attendance Tracking</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-zinc-900 p-6 rounded-lg shadow-xl border border-zinc-800 h-fit">
          <h2 className="text-lg font-semibold mb-4 border-b border-zinc-800 pb-2 text-zinc-100">
            Manual Check-In
          </h2>
          <form action={logAttendance} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400">Member</label>
              <select
                name="member_id"
                required
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
              >
                <option value="">Select member</option>
                {memberList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.member_code})
                  </option>
                ))}
              </select>
              {memberList.length === 0 && (
                <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
                  <p className="text-sm font-semibold text-zinc-200">No members yet</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Add a member before logging manual check-ins.
                  </p>
                  <Link
                    href="/owner/members"
                    className="mt-2 inline-block text-xs font-bold text-yellow-500 hover:text-yellow-400"
                  >
                    Go to Members
                  </Link>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Notes (Optional)</label>
              <input
                name="notes"
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-yellow-600 text-zinc-950 font-bold px-4 py-2 rounded hover:bg-yellow-500 transition-colors"
            >
              Log Attendance
            </button>
          </form>

          <div className="mt-8 p-4 border border-zinc-800 rounded bg-zinc-950 text-center">
            <p className="text-zinc-500 text-sm">QR Code Scanner (Coming Soon)</p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-100">Today&apos;s Check-Ins</h2>
            </div>
            {rows.length === 0 ? (
              <div className="m-6 flex flex-col items-center justify-center space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-10 text-center">
                <h3 className="text-lg font-semibold text-zinc-100">No check-ins today</h3>
                <p className="max-w-md text-sm text-zinc-500">
                  Today&apos;s attendance list is empty. Log a manual check-in or open members to get started.
                </p>
                <Link
                  href="/owner/members"
                  className="inline-flex items-center justify-center bg-yellow-600 text-zinc-950 font-bold px-4 py-2 rounded hover:bg-yellow-500 transition-colors"
                >
                  View Members
                </Link>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-zinc-800">
                <thead className="bg-zinc-950">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Member</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Method</th>
                  </tr>
                </thead>
                <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                  {rows.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                        {new Date(record.occurred_at).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-zinc-200">
                        {memberName(record.members)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 capitalize">
                        {record.method}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
