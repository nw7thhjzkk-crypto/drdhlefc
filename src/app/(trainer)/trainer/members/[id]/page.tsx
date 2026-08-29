import { createClient } from "@/utils/supabase/server";
import { addAssessment } from "./actions";

export default async function TrainerMemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("id", id)
    .single();

  if (!member) {
    return <div className="p-8 text-zinc-200">Member not found or not authorized.</div>;
  }

  const { data: assessments } = await supabase
    .from("assessments")
    .select("*")
    .eq("member_id", id)
    .order("recorded_at", { ascending: false });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-yellow-500">{member.name}&apos;s Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Profile Info */}
        <div className="lg:col-span-1 space-y-8">
            <div className="bg-zinc-900 p-6 rounded-lg shadow-xl border border-zinc-800">
                <h2 className="text-lg font-semibold mb-4 text-zinc-100">Details</h2>
                <dl className="space-y-3">
                    <div>
                        <dt className="text-sm font-medium text-zinc-500">Goal</dt>
                        <dd className="mt-1 text-sm text-zinc-200">{member.primary_goal || 'Not specified'}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-zinc-500">Contact</dt>
                        <dd className="mt-1 text-sm text-zinc-200">{member.email} <br/> {member.phone}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-zinc-500">Status</dt>
                        <dd className="mt-1 text-sm text-zinc-200 capitalize">{member.status}</dd>
                    </div>
                </dl>
            </div>

            {/* Add Assessment Form */}
            <div className="bg-zinc-900 p-6 rounded-lg shadow-xl border border-zinc-800">
                <h2 className="text-lg font-semibold mb-4 border-b border-zinc-800 pb-2 text-zinc-100">
                    Record New Assessment
                </h2>
                <form action={addAssessment} className="space-y-4">
                    <input type="hidden" name="member_id" value={member.id} />
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400">Height (cm)</label>
                            <input name="height_cm" type="number" step="0.1" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400">Weight (kg)</label>
                            <input name="weight_kg" type="number" step="0.1" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400">Body Fat % (Optional)</label>
                        <input name="body_fat_pct" type="number" step="0.1" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400">Trainer Notes</label>
                        <textarea name="notes" rows={3} className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"></textarea>
                    </div>
                    <button type="submit" className="w-full bg-yellow-600 text-zinc-950 font-bold px-4 py-2 rounded hover:bg-yellow-500 transition-colors">
                        Save Assessment
                    </button>
                </form>
            </div>
        </div>

        {/* Assessment History */}
        <div className="lg:col-span-2">
            <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800">
                    <h2 className="text-lg font-semibold text-zinc-100">Assessment History</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-800">
                        <thead className="bg-zinc-950">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Weight / Height</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">BMI</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                            {assessments?.map((a) => (
                                <tr key={a.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-200">
                                        {new Date(a.recorded_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                        {a.weight_kg} kg <br/>
                                        <span className="text-xs text-zinc-500">{a.height_cm} cm</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                        {a.bmi}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-zinc-400">
                                        {a.notes || '-'}
                                    </td>
                                </tr>
                            ))}
                            {(!assessments || assessments.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No assessments recorded yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
