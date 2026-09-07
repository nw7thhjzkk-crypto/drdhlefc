import { createClient } from "@/utils/supabase/server";
import { logAssessment } from "./actions";

type AssessmentMember = { id: string; name: string; member_code?: string | null };
type AssessmentAssignment = { members: AssessmentMember | AssessmentMember[] | null };

type AssessmentRecord = {
  id: string;
  recorded_at: string;
  source: string;
  members: { name: string } | null;
  height_cm: number | null;
  weight_kg: number | null;
  body_fat_pct: number | null;
  bmi: number | null;
};

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

  const memberIds = members.map(m => m.id);

  let recentAssessments: AssessmentRecord[] = [];
  if (memberIds.length > 0) {
    const { data } = await supabase
      .from("assessments")
      .select("*, members(name)")
      .in("member_id", memberIds)
      .order("recorded_at", { ascending: false })
      .limit(20);
    recentAssessments = data || [];
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-yellow-500">Assessments</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-zinc-900 p-6 rounded-lg shadow-xl border border-zinc-800 h-fit">
          <h2 className="text-lg font-semibold mb-4 border-b border-zinc-800 pb-2 text-zinc-100">
            Log Assessment
          </h2>
          <form action={logAssessment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400">Member</label>
              <select name="member_id" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200">
                <option value="">Select assigned member</option>
                {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} {m.member_code ? `(${m.member_code})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Height (cm)</label>
              <input type="number" step="0.1" name="height_cm" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Weight (kg)</label>
              <input type="number" step="0.1" name="weight_kg" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
            </div>
             <div>
              <label className="block text-sm font-medium text-zinc-400">Body Fat (%)</label>
              <input type="number" step="0.1" name="body_fat_pct" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
            </div>
            <button type="submit" className="w-full bg-yellow-600 text-zinc-950 font-bold px-4 py-2 rounded hover:bg-yellow-500 transition-colors mt-4">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Height / Weight</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">BMI</th>
                </tr>
              </thead>
              <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                {recentAssessments?.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                      {new Date(record.recorded_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-zinc-200">
                      {record.members?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                      {record.height_cm ? `${record.height_cm} cm` : '-'} / {record.weight_kg ? `${record.weight_kg} kg` : '-'}
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                      {record.bmi || '-'}
                    </td>
                  </tr>
                ))}
                {(!recentAssessments || recentAssessments.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No assessments recorded recently.</td>
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
