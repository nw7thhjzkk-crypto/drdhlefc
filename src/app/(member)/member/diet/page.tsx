import { createClient } from "@/utils/supabase/server";
import { acceptDietPlan, declineDietPlan } from "./actions";

type DietPlanSummary = {
  name: string | null;
  target_calories?: number | null;
  duration_days?: number | null;
  goal?: string | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  instructions?: string | null;
};

type MemberDietPlanRow = {
  id: string;
  diet_plans: DietPlanSummary | DietPlanSummary[] | null;
};

function asSingle<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}


export default async function MemberDietPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div>Not authenticated</div>;

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!member) return <div>Member profile not found</div>;

  const { data: pendingPlans } = await supabase
    .from("member_diet_plans")
    .select(`
        id,
        diet_plans (name, target_calories, duration_days, goal)
    `)
    .eq("member_id", member.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const { data: activePlans } = await supabase
    .from("member_diet_plans")
    .select(`
        id,
        diet_plans (name, target_calories, protein_g, carbs_g, fat_g, instructions)
    `)
    .eq("member_id", member.id)
    .eq("status", "accepted")
    .order("added_to_routine_at", { ascending: false });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-yellow-500">My Diet</h1>
      </div>

      {pendingPlans && pendingPlans.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700/50 p-6 rounded-lg shadow-xl mb-8">
            <h2 className="text-lg font-semibold text-yellow-500 mb-4">New Recommendations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingPlans.map((rec: MemberDietPlanRow) => (
                    <div key={rec.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-bold text-zinc-200">{asSingle(rec.diet_plans)?.name}</p>
                            <p className="text-xs text-zinc-500">{asSingle(rec.diet_plans)?.target_calories} kcal | Goal: {asSingle(rec.diet_plans)?.goal}</p>
                        </div>
                        <div className="flex space-x-2">
                            <form action={async () => { "use server"; await acceptDietPlan(rec.id); }}>
                                <button type="submit" className="bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-500">Accept</button>
                            </form>
                            <form action={async () => { "use server"; await declineDietPlan(rec.id); }}>
                                <button type="submit" className="bg-red-600 text-white text-xs px-3 py-1 rounded hover:bg-red-500">Decline</button>
                            </form>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-zinc-100 mb-4 border-b border-zinc-800 pb-2">Active Diet Routine</h2>
        {activePlans && activePlans.length > 0 ? (
            <div className="space-y-6">
                {activePlans.map((plan: MemberDietPlanRow) => (
                    <div key={plan.id} className="bg-zinc-950 border border-zinc-800 p-6 rounded-lg">
                        <h3 className="text-xl font-bold text-yellow-500 mb-2">{asSingle(plan.diet_plans)?.name}</h3>
                        <div className="grid grid-cols-4 gap-4 mb-4">
                            <div className="text-center p-2 bg-zinc-900 rounded">
                                <p className="text-xs text-zinc-500">Calories</p>
                                <p className="font-bold text-zinc-200">{asSingle(plan.diet_plans)?.target_calories}</p>
                            </div>
                            <div className="text-center p-2 bg-zinc-900 rounded">
                                <p className="text-xs text-zinc-500">Protein</p>
                                <p className="font-bold text-zinc-200">{asSingle(plan.diet_plans)?.protein_g}g</p>
                            </div>
                            <div className="text-center p-2 bg-zinc-900 rounded">
                                <p className="text-xs text-zinc-500">Carbs</p>
                                <p className="font-bold text-zinc-200">{asSingle(plan.diet_plans)?.carbs_g}g</p>
                            </div>
                            <div className="text-center p-2 bg-zinc-900 rounded">
                                <p className="text-xs text-zinc-500">Fat</p>
                                <p className="font-bold text-zinc-200">{asSingle(plan.diet_plans)?.fat_g}g</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-400 mb-1">Instructions:</p>
                            <p className="text-sm text-zinc-300 bg-zinc-900 p-3 rounded">{asSingle(plan.diet_plans)?.instructions || 'None provided.'}</p>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-8 text-zinc-500">No active diet plans in your routine.</div>
        )}
      </div>

    </div>
  );
}
