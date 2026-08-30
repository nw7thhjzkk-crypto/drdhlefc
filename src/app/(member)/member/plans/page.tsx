import { createClient } from "@/utils/supabase/server";

export default async function MemberPlansPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div>Not authenticated</div>;

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!member) return <div>Member profile not found</div>;

  const [
      { data: myDietPlans },
      { data: myWorkoutPlans }
  ] = await Promise.all([
      supabase.from("diet_plans").select("*").eq("created_by", user.id).eq("source", "member").is("deleted_at", null).order("created_at", { ascending: false }),
      supabase.from("workout_plans").select("*").eq("created_by", user.id).eq("source", "member").is("deleted_at", null).order("created_at", { ascending: false })
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <h1 className="text-2xl font-bold text-yellow-500">My Personal Plans</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Diet Plans */}
        <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-zinc-100">My Diet Plans</h2>
                <button className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded hover:bg-zinc-700">Add New</button>
            </div>

            <div className="space-y-4">
                {myDietPlans?.map(plan => (
                    <div key={plan.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-zinc-200">{plan.name}</h3>
                                <p className="text-xs text-zinc-500 mt-1">{plan.target_calories} kcal | {plan.duration_days} Days</p>
                            </div>
                            <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-1 rounded">Goal: {plan.goal}</span>
                        </div>
                    </div>
                ))}
                {(!myDietPlans || myDietPlans.length === 0) && (
                    <p className="text-zinc-500 text-sm text-center py-4">You have not created any personal diet plans yet.</p>
                )}
            </div>
        </div>

        {/* Workout Plans */}
        <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-zinc-100">My Workout Plans</h2>
                <button className="bg-zinc-800 text-zinc-300 text-xs px-3 py-1 rounded hover:bg-zinc-700">Add New</button>
            </div>

            <div className="space-y-4">
                {myWorkoutPlans?.map(plan => (
                    <div key={plan.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-zinc-200">{plan.name}</h3>
                                <p className="text-xs text-zinc-500 mt-1">{plan.duration_days} Days</p>
                            </div>
                            <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-1 rounded">Goal: {plan.goal}</span>
                        </div>
                    </div>
                ))}
                {(!myWorkoutPlans || myWorkoutPlans.length === 0) && (
                    <p className="text-zinc-500 text-sm text-center py-4">You have not created any personal workout plans yet.</p>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}
