import { createClient } from "@/utils/supabase/server";
import { createAssessment } from "./actions";

type AssessmentMember = { id: string; name: string; member_code?: string | null };
type AssessmentAssignment = { members: AssessmentMember | AssessmentMember[] | null };

type AssessmentRow = {
  id: string;
  recorded_at: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  bmi: number | null;
  body_fat_pct: number | null;
  members: { name: string } | { name: string }[] | null;
};

function memberName(members: AssessmentRow["members"]): string {
  if (!members) return "—";
  return Array.isArray(members) ? (members[0]?.name ?? "—") : members.name;
}

export default async function TrainerAssessmentsPage() {
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
    .eq("trainer_id", trainer.id)
    .is("unassigned_at", null);

  const members: AssessmentMember[] = ((assignments as AssessmentAssignment[] | null) ?? []).flatMap((a) => {
    const m = a.members;
    if (!m) return [];
    return Array.isArray(m) ? m : [m];
  });

  const memberIds = members.map((m) => m.id);

  const { data: recentAssessments } = memberIds.length
    ? await supabase
        .from("assessments")
        .select("id, recorded_at, height_cm, weight_kg, bmi, body_fat_pct, members(name)")
        .in("member_id", memberIds)
        .order("recorded_at", { ascending: false })
        .limit(25)
    : { data: [] as AssessmentRow[] };

  const rows = (recentAssessments as AssessmentRow[] | null) ?? [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-yellow-500">Assessments</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-zinc-900 p-6 rounded-lg shadow-xl border border-zinc-800 h-fit">
          <h2 className="text-lg font-semibold mb-4 border-b border-zinc-800 pb-2 text-zinc-100">
            New Assessment
          </h2>
          <form action={createAssessment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400">Member</label>
              <select
                name="member_id"
                required
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
              >
                <option value="">Select assigned member</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.member_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-400">Height (cm)</label>
                <input
                  name="height_cm"
                  type="number"
                  step="0.1"
                  min="0"
                  className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400">Weight (kg)</label>
                <input
                  name="weight_kg"
                  type="number"
                  step="0.1"
                  min="0"
                  className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400">Body fat %</label>
                <input
                  name="body_fat_pct"
                  type="number"
                  step="0.1"
                  min="0"
                  className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400">Waist (cm)</label>
                <input
                  name="waist_cm"
                  type="number"
                  step="0.1"
                  min="0"
                  className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400">Chest (cm)</label>
                <input
                  name="chest_cm"
                  type="number"
                  step="0.1"
                  min="0"
                  className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400">Arm (cm)</label>
                <input
                  name="arm_cm"
                  type="number"
                  step="0.1"
                  min="0"
                  className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400">Thigh (cm)</label>
                <input
                  name="thigh_cm"
                  type="number"
                  step="0.1"
                  min="0"
                  className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400">Neck (cm)</label>
                <input
                  name="neck_cm"
                  type="number"
                  step="0.1"
                  min="0"
                  className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                />
              </div>
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
              Save Assessment
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-100">Recent Assessments</h2>
            </div>
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-950">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Weight</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">BMI</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Body fat</th>
                </tr>
              </thead>
              <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                {rows.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                      {record.recorded_at
                        ? new Date(record.recorded_at).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-zinc-200">
                      {memberName(record.members)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                      {record.weight_kg != null ? `${record.weight_kg} kg` : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                      {record.bmi != null ? record.bmi : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                      {record.body_fat_pct != null ? `${record.body_fat_pct}%` : "—"}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                      No assessments yet for assigned members.
                    </td>
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
