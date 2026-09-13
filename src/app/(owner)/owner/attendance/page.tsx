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

export default async function OwnerAttendancePage({
  searchParams,
}: {
  searchParams?: Promise<{ from?: string; to?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
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

  const fromDate = params.from || today.toISOString().slice(0, 10);
  const toDate = params.to || "";

  const fromISO = `${fromDate}T00:00:00.000Z`;
  const toISO = toDate ? `${toDate}T23:59:59.999Z` : undefined;

  let query = supabase
    .from("attendance")
    .select("id, occurred_at, method, members(name)")
    .gte("occurred_at", fromISO)
    .order("occurred_at", { ascending: false });

  if (toISO) {
    query = query.lte("occurred_at", toISO);
  }

  const { data: recentAttendance } = await query;

  const rows = (recentAttendance as AttendanceRecord[] | null) ?? [];

  const isFiltered = !!(params.from || params.to);

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
              <label htmlFor="attendance-member" className="block text-sm font-medium text-zinc-400">Member</label>
              <select
                id="attendance-member"
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
                  <p className="text-sm font-semibold text-yellow-500">No members yet</p>
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
              <label htmlFor="attendance-notes" className="block text-sm font-medium text-zinc-400">Notes (Optional)</label>
              <input
                id="attendance-notes"
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

        <div className="lg:col-span-2 space-y-4">
          <form className="flex flex-wrap items-end gap-3 bg-zinc-900 p-4 rounded-lg border border-zinc-800">
            <div>
              <label htmlFor="filter-from" className="block text-xs font-medium text-zinc-400 mb-1">From</label>
              <input
                id="filter-from"
                type="date"
                name="from"
                defaultValue={fromDate}
                className="bg-zinc-950 border border-zinc-800 rounded p-1.5 text-sm text-zinc-200"
              />
            </div>
            <div>
              <label htmlFor="filter-to" className="block text-xs font-medium text-zinc-400 mb-1">To</label>
              <input
                id="filter-to"
                type="date"
                name="to"
                defaultValue={toDate}
                className="bg-zinc-950 border border-zinc-800 rounded p-1.5 text-sm text-zinc-200"
              />
            </div>
            <button
              type="submit"
              className="bg-zinc-800 text-yellow-500 font-bold px-3 py-1.5 rounded text-sm hover:bg-zinc-700 transition-colors"
            >
              Filter
            </button>
            {isFiltered && (
              <Link
                href="/owner/attendance"
                className="text-xs text-zinc-400 hover:text-zinc-200 underline"
              >
                Clear
              </Link>
            )}
          </form>

          <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-100">
                {isFiltered ? "Filtered" : "Today&apos;s"} Check-Ins
                <span className="ml-2 text-sm font-normal text-zinc-400">({rows.length})</span>
              </h2>
            </div>
            {rows.length === 0 ? (
              <div className="m-6 flex flex-col items-center justify-center space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-10 text-center">
                <h3 className="text-lg font-semibold text-yellow-500">No check-ins found</h3>
                <p className="max-w-md text-sm text-zinc-500">
                  {isFiltered
                    ? "No attendance records match your filter criteria. Try adjusting the date range."
                    : "Today&apos;s attendance list is empty. Log a manual check-in or open members to get started."}
                </p>
                {!isFiltered && (
                  <Link
                    href="/owner/members"
                    className="inline-flex items-center justify-center bg-yellow-600 text-zinc-950 font-bold px-4 py-2 rounded hover:bg-yellow-500 transition-colors"
                  >
                    View Members
                  </Link>
                )}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-zinc-800">
                <thead className="bg-zinc-950">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Date &amp; Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Member</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Method</th>
                  </tr>
                </thead>
                <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                  {rows.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                        {new Date(record.occurred_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
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
