import { createClient } from "@/utils/supabase/server";
import { logAttendance } from "./actions";

export default async function TrainerAttendancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div>Not authenticated</div>;

  const { data: trainer } = await supabase
    .from("trainers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!trainer) return <div>Trainer profile not found</div>;

  const { data: assignments } = await supabase
    .from("member_trainers")
    .select("members(id, name, member_code)")
    .eq("trainer_id", trainer.id);

  interface AssignedMember {
      id: string;
      name: string;
      member_code: string;
  }

  const members = assignments?.map((a: { members: AssignedMember | AssignedMember[] | null }) => {
      if (Array.isArray(a.members)) return a.members[0];
      return a.members;
  }).filter(Boolean) as AssignedMember[] || [];

  const today = new Date();
  today.setHours(0,0,0,0);

  const { data: recentAttendance } = await supabase
    .from("attendance")
    .select("*, members(name)")
    .eq("trainer_id", trainer.id)
    .gte("occurred_at", today.toISOString())
    .order("occurred_at", { ascending: false });

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
              <select name="member_id" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200">
                <option value="">Select assigned member</option>
                {members.map((m: AssignedMember) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.member_code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Notes (Optional)</label>
              <input name="notes" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
            </div>
            <button type="submit" className="w-full bg-yellow-600 text-zinc-950 font-bold px-4 py-2 rounded hover:bg-yellow-500 transition-colors">
              Log Attendance
            </button>
          </form>

          <div className="mt-8 p-4 border border-zinc-800 rounded bg-zinc-950 text-center">
             <p className="text-zinc-500 text-sm">QR Code Scanner (Coming Soon)</p>
             <div className="mt-4 aspect-square bg-zinc-900 border-2 border-dashed border-zinc-700 flex items-center justify-center">
                 <span className="text-zinc-600 text-xs">Camera Feed Placeholder</span>
             </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 overflow-hidden">
             <div className="px-6 py-4 border-b border-zinc-800">
                <h2 className="text-lg font-semibold text-zinc-100">Today&apos;s Check-Ins</h2>
            </div>
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-950">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Method</th>
                </tr>
              </thead>
              <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                {recentAttendance?.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                      {new Date(record.occurred_at).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-zinc-200">
                      {record.members?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 capitalize">
                      {record.method}
                    </td>
                  </tr>
                ))}
                {(!recentAttendance || recentAttendance.length === 0) && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">No attendance logged today.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
