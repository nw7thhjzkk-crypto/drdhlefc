import { createClient } from "@/utils/supabase/server";
import { createWorkoutPlan, softDeleteWorkoutPlan } from "./actions";
import AssignPlanForm from "./components/AssignPlanForm";

export default async function WorkoutPlansPage() {
  const supabase = await createClient();

  const { data: plans } = await supabase
    .from("workout_plans")
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
        <h1 className="text-2xl font-bold text-yellow-500">Workout Plans</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-zinc-900 p-6 rounded-lg shadow-xl border border-zinc-800 h-fit">
          <h2 className="text-lg font-semibold mb-4 border-b border-zinc-800 pb-2 text-zinc-100">
            Create Workout Plan
          </h2>
          <form action={createWorkoutPlan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400">Plan Name</label>
              <input name="name" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:border-yellow-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Goal Category</label>
              <select name="goal" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200">
                <option value="Weight Loss">Weight Loss</option>
                <option value="Muscle Gain">Muscle Gain</option>
                <option value="Strength">Strength</option>
                <option value="Fitness">Fitness</option>
                <option value="General Health">General Health</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Duration (Days)</label>
              <input name="duration_days" type="number" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Content JSON (Exercises)</label>
              <textarea name="content" rows={4} placeholder='{"exercises": [{"name": "Squat", "sets": 3}]}' className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 font-mono text-xs"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Instructions / Notes</label>
              <textarea name="instructions" rows={2} className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"></textarea>
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
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-yellow-500">{plan.name}</h3>
                                <p className="text-xs text-zinc-500">{plan.duration_days} Days • Goal: {plan.goal}</p>
                            </div>
                            <form action={async () => { "use server"; await softDeleteWorkoutPlan(plan.id); }}>
                                <button type="submit" className="text-red-400 text-xs hover:text-red-300">Archive</button>
                            </form>
                        </div>

                        <AssignPlanForm members={members || []} workout_plan_id={plan.id} />
                    </div>
                ))}
            </div>
            {(!plans || plans.length === 0) && (
              <p className="text-center text-zinc-500 py-8">No active workout plans found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
