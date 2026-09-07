import { createClient } from "@/utils/supabase/server";
import {
  createWorkoutPlan,
  createDietPlan,
  updateWorkoutPlan,
  updateDietPlan,
  assignWorkoutPlan,
  assignDietPlan,
} from "./actions";

type PlanMember = { id: string; name: string; member_code?: string | null };
type AssignmentRow = { members: PlanMember | PlanMember[] | null };

type WorkoutPlan = {
  id: string;
  name: string;
  goal: string | null;
  duration_days: number | null;
  created_at: string;
  instructions?: string | null;
  content?: unknown;
};

type DietPlan = {
  id: string;
  name: string;
  goal: string | null;
  duration_days: number | null;
  target_calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  created_at: string;
  instructions?: string | null;
  content?: unknown;
};

export default async function TrainerPlansPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  const members: PlanMember[] = ((assignments as AssignmentRow[] | null) ?? []).flatMap(
    (a) => {
      const m = a.members;
      if (!m) return [];
      return Array.isArray(m) ? m : [m];
    }
  );

  const { data: workoutPlans } = await supabase
    .from("workout_plans")
    .select("id, name, goal, duration_days, created_at, instructions, content")
    .eq("created_by", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const { data: dietPlans } = await supabase
    .from("diet_plans")
    .select(
      "id, name, goal, duration_days, target_calories, protein_g, carbs_g, fat_g, created_at, instructions, content"
    )
    .eq("created_by", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const workouts = (workoutPlans as WorkoutPlan[] | null) ?? [];
  const diets = (dietPlans as DietPlan[] | null) ?? [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-yellow-500">Plans</h1>
      </div>

      {/* Workout plans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-zinc-900 p-6 rounded-lg shadow-xl border border-zinc-800 h-fit">
          <h2 className="text-lg font-semibold mb-4 border-b border-zinc-800 pb-2 text-zinc-100">
            Create Workout Plan
          </h2>
          <form action={createWorkoutPlan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400">Plan Name</label>
              <input
                name="name"
                required
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Goal</label>
              <select
                name="goal"
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
              >
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
              <input
                name="duration_days"
                type="number"
                required
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">
                Content JSON (Exercises)
              </label>
              <textarea
                name="content"
                rows={3}
                placeholder='{"exercises": [{"name": "Squat", "sets": 3}]}'
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Instructions</label>
              <textarea
                name="instructions"
                rows={2}
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-yellow-600 text-zinc-950 font-bold px-4 py-2 rounded hover:bg-yellow-500 transition-colors"
            >
              Save Workout Plan
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 p-6">
            <h2 className="text-lg font-semibold mb-4 border-b border-zinc-800 pb-2 text-zinc-100">
              Your Workout Plans
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workouts.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg"
                >
                  <h3 className="font-bold text-yellow-500">{plan.name}</h3>
                  <p className="text-xs text-zinc-500 mb-3">
                    {plan.duration_days ?? "—"} Days • Goal: {plan.goal ?? "—"}
                  </p>

                  <details className="mb-3 group text-xs text-zinc-400">
                    <summary className="cursor-pointer hover:text-yellow-500">
                      Edit plan
                    </summary>
                    <form
                      action={async (formData) => {
                        "use server";
                        await updateWorkoutPlan(plan.id, formData);
                      }}
                      className="mt-2 space-y-2 bg-zinc-900 p-2 rounded border border-zinc-800"
                    >
                      <input
                        name="name"
                        defaultValue={plan.name}
                        required
                        className="block w-full bg-zinc-950 border border-zinc-800 rounded p-1"
                        placeholder="Plan Name"
                      />
                      <select
                        name="goal"
                        defaultValue={plan.goal || "Fitness"}
                        className="block w-full bg-zinc-950 border border-zinc-800 rounded p-1"
                      >
                        <option value="Weight Loss">Weight Loss</option>
                        <option value="Muscle Gain">Muscle Gain</option>
                        <option value="Strength">Strength</option>
                        <option value="Fitness">Fitness</option>
                        <option value="General Health">General Health</option>
                        <option value="Custom">Custom</option>
                      </select>
                      <input
                        name="duration_days"
                        type="number"
                        defaultValue={plan.duration_days || ""}
                        required
                        className="block w-full bg-zinc-950 border border-zinc-800 rounded p-1"
                        placeholder="Duration (Days)"
                      />
                      <textarea
                        name="content"
                        rows={2}
                        defaultValue={plan.content ? JSON.stringify(plan.content) : ""}
                        placeholder='{"exercises": []}'
                        className="block w-full bg-zinc-950 border border-zinc-800 rounded p-1 font-mono"
                      />
                      <textarea
                        name="instructions"
                        rows={2}
                        defaultValue={plan.instructions || ""}
                        placeholder="Instructions"
                        className="block w-full bg-zinc-950 border border-zinc-800 rounded p-1"
                      />
                      <button
                        type="submit"
                        className="w-full bg-yellow-600 text-zinc-950 font-bold px-2 py-1 rounded hover:bg-yellow-500"
                      >
                        Save
                      </button>
                    </form>
                  </details>

                  <form action={assignWorkoutPlan} className="pt-3 border-t border-zinc-800">
                    <input type="hidden" name="workout_plan_id" value={plan.id} />
                    <div className="flex space-x-2">
                      <select
                        name="member_id"
                        required
                        className="block w-full bg-zinc-950 border border-zinc-700 rounded p-1 text-xs text-zinc-200"
                      >
                        <option value="">Assign to member...</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                            {m.member_code ? ` (${m.member_code})` : ""}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="bg-yellow-600 text-zinc-950 text-xs font-bold px-3 py-1 rounded hover:bg-yellow-500"
                      >
                        Assign
                      </button>
                    </div>
                  </form>
                </div>
              ))}
            </div>
            {workouts.length === 0 && (
              <p className="text-center text-zinc-500 py-8">No workout plans yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Diet plans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-zinc-900 p-6 rounded-lg shadow-xl border border-zinc-800 h-fit">
          <h2 className="text-lg font-semibold mb-4 border-b border-zinc-800 pb-2 text-zinc-100">
            Create Diet Plan
          </h2>
          <form action={createDietPlan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400">Plan Name</label>
              <input
                name="name"
                required
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Goal</label>
              <select
                name="goal"
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
              >
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
                <input
                  name="target_calories"
                  type="number"
                  required
                  className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400">Duration (Days)</label>
                <input
                  name="duration_days"
                  type="number"
                  required
                  className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-zinc-400">Protein (g)</label>
                <input
                  name="protein_g"
                  type="number"
                  required
                  className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400">Carbs (g)</label>
                <input
                  name="carbs_g"
                  type="number"
                  required
                  className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400">Fat (g)</label>
                <input
                  name="fat_g"
                  type="number"
                  required
                  className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Content JSON (Meals)</label>
              <textarea
                name="content"
                rows={3}
                placeholder='{"meals": ["Chicken & Rice", "Eggs"]}'
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Instructions</label>
              <textarea
                name="instructions"
                rows={2}
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-yellow-600 text-zinc-950 font-bold px-4 py-2 rounded hover:bg-yellow-500 transition-colors"
            >
              Save Diet Plan
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 p-6">
            <h2 className="text-lg font-semibold mb-4 border-b border-zinc-800 pb-2 text-zinc-100">
              Your Diet Plans
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {diets.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg"
                >
                  <h3 className="font-bold text-yellow-500">{plan.name}</h3>
                  <p className="text-xs text-zinc-500 mb-2">
                    {plan.duration_days ?? "—"} Days • Goal: {plan.goal ?? "—"}
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs mb-3">
                    <div className="bg-zinc-900 p-1 rounded border border-zinc-800">
                      <span className="block text-zinc-500">Cal</span>
                      {plan.target_calories ?? "—"}
                    </div>
                    <div className="bg-zinc-900 p-1 rounded border border-zinc-800">
                      <span className="block text-zinc-500">Pro</span>
                      {plan.protein_g ?? "—"}
                    </div>
                    <div className="bg-zinc-900 p-1 rounded border border-zinc-800">
                      <span className="block text-zinc-500">Carb</span>
                      {plan.carbs_g ?? "—"}
                    </div>
                    <div className="bg-zinc-900 p-1 rounded border border-zinc-800">
                      <span className="block text-zinc-500">Fat</span>
                      {plan.fat_g ?? "—"}
                    </div>
                  </div>

                  <details className="mb-3 group text-xs text-zinc-400">
                    <summary className="cursor-pointer hover:text-yellow-500">
                      Edit plan
                    </summary>
                    <form
                      action={async (formData) => {
                        "use server";
                        await updateDietPlan(plan.id, formData);
                      }}
                      className="mt-2 space-y-2 bg-zinc-900 p-2 rounded border border-zinc-800"
                    >
                      <input
                        name="name"
                        defaultValue={plan.name}
                        required
                        className="block w-full bg-zinc-950 border border-zinc-800 rounded p-1"
                        placeholder="Plan Name"
                      />
                      <select
                        name="goal"
                        defaultValue={plan.goal || "Custom"}
                        className="block w-full bg-zinc-950 border border-zinc-800 rounded p-1"
                      >
                        <option value="Weight Loss">Weight Loss</option>
                        <option value="Weight Gain">Weight Gain</option>
                        <option value="Muscle Gain">Muscle Gain</option>
                        <option value="Fitness">Fitness</option>
                        <option value="General Health">General Health</option>
                        <option value="Custom">Custom</option>
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          name="target_calories"
                          type="number"
                          defaultValue={plan.target_calories || ""}
                          required
                          className="block w-full bg-zinc-950 border border-zinc-800 rounded p-1"
                          placeholder="Calories"
                        />
                        <input
                          name="duration_days"
                          type="number"
                          defaultValue={plan.duration_days || ""}
                          required
                          className="block w-full bg-zinc-950 border border-zinc-800 rounded p-1"
                          placeholder="Duration (Days)"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          name="protein_g"
                          type="number"
                          defaultValue={plan.protein_g || ""}
                          required
                          className="block w-full bg-zinc-950 border border-zinc-800 rounded p-1"
                          placeholder="Protein"
                        />
                        <input
                          name="carbs_g"
                          type="number"
                          defaultValue={plan.carbs_g || ""}
                          required
                          className="block w-full bg-zinc-950 border border-zinc-800 rounded p-1"
                          placeholder="Carbs"
                        />
                        <input
                          name="fat_g"
                          type="number"
                          defaultValue={plan.fat_g || ""}
                          required
                          className="block w-full bg-zinc-950 border border-zinc-800 rounded p-1"
                          placeholder="Fat"
                        />
                      </div>
                      <textarea
                        name="content"
                        rows={2}
                        defaultValue={plan.content ? JSON.stringify(plan.content) : ""}
                        placeholder='{"meals": []}'
                        className="block w-full bg-zinc-950 border border-zinc-800 rounded p-1 font-mono"
                      />
                      <textarea
                        name="instructions"
                        rows={2}
                        defaultValue={plan.instructions || ""}
                        placeholder="Instructions"
                        className="block w-full bg-zinc-950 border border-zinc-800 rounded p-1"
                      />
                      <button
                        type="submit"
                        className="w-full bg-yellow-600 text-zinc-950 font-bold px-2 py-1 rounded hover:bg-yellow-500"
                      >
                        Save
                      </button>
                    </form>
                  </details>

                  <form action={assignDietPlan} className="pt-3 border-t border-zinc-800">
                    <input type="hidden" name="diet_plan_id" value={plan.id} />
                    <div className="flex space-x-2">
                      <select
                        name="member_id"
                        required
                        className="block w-full bg-zinc-950 border border-zinc-700 rounded p-1 text-xs text-zinc-200"
                      >
                        <option value="">Assign to member...</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                            {m.member_code ? ` (${m.member_code})` : ""}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="bg-yellow-600 text-zinc-950 text-xs font-bold px-3 py-1 rounded hover:bg-yellow-500"
                      >
                        Assign
                      </button>
                    </div>
                  </form>
                </div>
              ))}
            </div>
            {diets.length === 0 && (
              <p className="text-center text-zinc-500 py-8">No diet plans yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
