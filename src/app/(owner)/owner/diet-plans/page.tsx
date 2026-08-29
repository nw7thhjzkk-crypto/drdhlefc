import { createClient } from "@/utils/supabase/server";
import { createDietPlan, softDeleteDietPlan } from "./actions";
import AssignPlanForm from "./components/AssignPlanForm";

export default async function DietPlansPage() {
  const supabase = await createClient();

  const { data: plans } = await supabase
    .from("diet_plans")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const { data: members } = await supabase
    .from("members")
    .select("id, name")
    .order("name");

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-yellow-500">Diet Plans</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-zinc-900 p-6 rounded-lg shadow-xl border border-zinc-800 h-fit">
          <h2 className="text-lg font-semibold mb-4 border-b border-zinc-800 pb-2 text-zinc-100">
            Create Diet Plan
          </h2>
          <form action={createDietPlan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400">Plan Name</label>
              <input name="name" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:border-yellow-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Goal Category</label>
              <select name="goal" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200">
                <option value="Weight Loss">Weight Loss</option>
                <option value="Weight Gain">Weight Gain</option>
                <option value="Muscle Gain">Muscle Gain</option>
                <option value="Fitness">Fitness</option>
                <option value="General Health">General Health</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400">Target Calories</label>
                <input name="target_calories" type="number" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400">Duration (Days)</label>
                <input name="duration_days" type="number" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-zinc-400">Protein (g)</label>
                <input name="protein_g" type="number" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400">Carbs (g)</label>
                <input name="carbs_g" type="number" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400">Fat (g)</label>
                <input name="fat_g" type="number" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Instructions / Content JSON</label>
              <textarea name="content" rows={4} placeholder='{"meals": ["Chicken & Rice", "Eggs"]}' className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 font-mono text-xs"></textarea>
            </div>
            <button type="submit" className="w-full bg-yellow-600 text-zinc-950 font-bold px-4 py-2 rounded hover:bg-yellow-500 transition-colors">
              Save Plan
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 p-6">
            <h2 className="text-lg font-semibold mb-4 border-b border-zinc-800 pb-2 text-zinc-100">
                Plan Directory
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans?.map((plan) => (
                    <div key={plan.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-yellow-500">{plan.name}</h3>
                                <p className="text-xs text-zinc-500 mb-2">{plan.duration_days} Days • Goal: {plan.goal}</p>
                            </div>
                            <form action={async () => { "use server"; await softDeleteDietPlan(plan.id); }}>
                                <button type="submit" className="text-red-400 text-xs hover:text-red-300">Archive</button>
                            </form>
                        </div>

                        <div className="grid grid-cols-4 gap-2 text-center text-xs mt-2 mb-2">
                            <div className="bg-zinc-900 p-1 rounded border border-zinc-800"><span className="block text-zinc-500">Cal</span>{plan.target_calories}</div>
                            <div className="bg-zinc-900 p-1 rounded border border-zinc-800"><span className="block text-zinc-500">Pro</span>{plan.protein_g}</div>
                            <div className="bg-zinc-900 p-1 rounded border border-zinc-800"><span className="block text-zinc-500">Carb</span>{plan.carbs_g}</div>
                            <div className="bg-zinc-900 p-1 rounded border border-zinc-800"><span className="block text-zinc-500">Fat</span>{plan.fat_g}</div>
                        </div>

                        <AssignPlanForm members={members || []} diet_plan_id={plan.id} />
                    </div>
                ))}
            </div>
            {(!plans || plans.length === 0) && (
              <p className="text-center text-zinc-500 py-8">No active diet plans found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
