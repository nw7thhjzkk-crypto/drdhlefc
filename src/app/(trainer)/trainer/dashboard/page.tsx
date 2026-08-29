import { createClient } from "@/utils/supabase/server";

export default async function TrainerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Not authenticated</div>;
  }

  const { data: trainer } = await supabase
    .from("trainers")
    .select("id, name")
    .eq("profile_id", user.id)
    .single();

  if (!trainer) {
    return <div>Trainer profile not found</div>;
  }

  const { count: assignedCount } = await supabase
    .from("member_trainers")
    .select("*", { count: "exact", head: true })
    .eq("trainer_id", trainer.id);

  const { data: recentAssessments } = await supabase
    .from("assessments")
    .select("*, members(name)")
    .eq("recorded_by", user.id)
    .order("recorded_at", { ascending: false })
    .limit(5);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-yellow-500">Welcome, {trainer.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg shadow-xl text-center">
          <p className="text-sm font-medium text-zinc-400">Assigned Members</p>
          <p className="mt-2 text-4xl font-bold text-zinc-100">{assignedCount || 0}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg shadow-xl text-center">
          <p className="text-sm font-medium text-zinc-400">Assessments Done</p>
          <p className="mt-2 text-4xl font-bold text-zinc-100">{recentAssessments?.length || 0}</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-medium text-zinc-100">Recent Assessments</h2>
        </div>
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-950">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Member</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Weight (kg)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">BMI</th>
            </tr>
          </thead>
          <tbody className="bg-zinc-900 divide-y divide-zinc-800">
            {recentAssessments?.map((record) => (
              <tr key={record.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                  {new Date(record.recorded_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-200">
                  {record.members?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                  {record.weight_kg}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                  {record.bmi}
                </td>
              </tr>
            ))}
            {(!recentAssessments || recentAssessments.length === 0) && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No recent assessments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
