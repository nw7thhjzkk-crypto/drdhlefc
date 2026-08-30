import { createClient } from "@/utils/supabase/server";
import { acceptWorkoutPlan, declineWorkoutPlan } from "./actions";

export default async function MemberWorkoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div>Not authenticated</div>;

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!member) return <div>Member profile not found</div>;

  const pendingPlansQuery = supabase
    .from("member_workout_plans")
    .select(`
        id,
        workout_plans (name, duration_days, goal)
    `)
    .eq("member_id", member.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const activePlansQuery = supabase
    .from("member_workout_plans")
    .select(`
        id,
        workout_plans (name, duration_days, instructions, goal)
    `)
    .eq("member_id", member.id)
    .eq("status", "accepted")
    .order("added_to_routine_at", { ascending: false });

  const [
    { data: pendingPlansData },
    { data: activePlansData }
  ] = await Promise.all([
    pendingPlansQuery,
    activePlansQuery
  ]);

  interface PendingPlan {
    id: string;
    workout_plans: { name: string; duration_days: number; goal: string; } | null;
  }

  interface ActivePlan {
    id: string;
    workout_plans: { name: string; duration_days: number; instructions: string; goal: string; } | null;
  }

  const pendingPlans = pendingPlansData?.map((rec) => {
    return {
      id: rec.id,
      workout_plans: Array.isArray(rec.workout_plans) ? rec.workout_plans[0] : rec.workout_plans
    }
  }) as PendingPlan[] || [];

  const activePlans = activePlansData?.map((plan) => {
    return {
      id: plan.id,
      workout_plans: Array.isArray(plan.workout_plans) ? plan.workout_plans[0] : plan.workout_plans
    }
  }) as ActivePlan[] || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-yellow-500">My Workouts</h1>
      </div>

      {pendingPlans && pendingPlans.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700/50 p-6 rounded-lg shadow-xl mb-8">
            <h2 className="text-lg font-semibold text-yellow-500 mb-4">New Recommendations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingPlans.map((rec) => (
                    <div key={rec.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-bold text-zinc-200">{rec.workout_plans?.name}</p>
                            <p className="text-xs text-zinc-500">{rec.workout_plans?.duration_days} Days | Goal: {rec.workout_plans?.goal}</p>
                        </div>
                        <div className="flex space-x-2">
                            <form action={async () => { "use server"; await acceptWorkoutPlan(rec.id); }}>
                                <button type="submit" className="bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-500">Accept</button>
                            </form>
                            <form action={async () => { "use server"; await declineWorkoutPlan(rec.id); }}>
                                <button type="submit" className="bg-red-600 text-white text-xs px-3 py-1 rounded hover:bg-red-500">Decline</button>
                            </form>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-zinc-100 mb-4 border-b border-zinc-800 pb-2">Active Workout Routine</h2>
        {activePlans && activePlans.length > 0 ? (
            <div className="space-y-6">
                {activePlans.map((plan) => (
                    <div key={plan.id} className="bg-zinc-950 border border-zinc-800 p-6 rounded-lg">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-yellow-500">{plan.workout_plans?.name}</h3>
                            <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded border border-zinc-700">{plan.workout_plans?.duration_days} Days</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-400 mb-1">Instructions:</p>
                            <p className="text-sm text-zinc-300 bg-zinc-900 p-3 rounded whitespace-pre-wrap">{plan.workout_plans?.instructions || 'None provided.'}</p>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-8 text-zinc-500">No active workout plans in your routine.</div>
        )}
      </div>

    </div>
  );
}
