import { createClient } from "@/utils/supabase/server";
import { createExercise, updateExercise, deleteExercise, seedStarterExercises } from "./actions";

export default async function ExercisesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Not authenticated</div>;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") {
    return <div>Unauthorized</div>;
  }

  const { data: exercises, error } = await supabase
    .from("exercises")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="erp-page">Error loading exercises: {error.message}</div>;
  }

  return (
    <div className="erp-page">
      <header className="erp-header">
        <h1 className="text-2xl font-bold text-zinc-100">Exercise Library</h1>
      </header>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {exercises?.length === 0 ? (
            <div className="erp-card text-center py-12">
              <h3 className="text-xl font-semibold text-zinc-200 mb-2">No exercises found</h3>
              <p className="text-zinc-400 mb-6">Your exercise library is empty. Get started quickly by seeding standard exercises.</p>
              <form action={seedStarterExercises}>
                <button type="submit" className="bg-yellow-600 text-zinc-900 font-bold px-6 py-2 rounded hover:bg-yellow-500 transition-colors">
                  Seed Starter Exercises
                </button>
              </form>
            </div>
          ) : (
            exercises?.map((exercise) => (
              <div key={exercise.id} className="erp-card">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-100">{exercise.name}</h3>
                    <p className="text-sm text-zinc-400">{exercise.category}</p>
                    {exercise.media_url && (
                      <p className="text-xs text-blue-400 mt-1">
                        <a href={exercise.media_url} target="_blank" rel="noopener noreferrer">View Media</a>
                      </p>
                    )}
                  </div>
                  <form action={async () => {
                    "use server";
                    await deleteExercise(exercise.id);
                  }}>
                    <button type="submit" className="text-xs text-red-500 hover:text-red-400">
                      Delete
                    </button>
                  </form>
                </div>

                {exercise.instructions && (
                  <p className="mt-2 text-sm text-zinc-300">{exercise.instructions}</p>
                )}

                <details className="mt-4 group">
                  <summary className="cursor-pointer text-xs text-zinc-400 hover:text-yellow-500 list-none text-right">
                    Edit exercise
                  </summary>
                  <form
                    action={async (formData) => {
                      "use server";
                      await updateExercise(exercise.id, formData);
                    }}
                    className="mt-3 space-y-3 border-t border-zinc-800 pt-3"
                  >
                    <div>
                      <label className="block text-xs text-zinc-500">Name</label>
                      <input name="name" defaultValue={exercise.name} required className="mt-1 block w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500">Category</label>
                      <input name="category" defaultValue={exercise.category || ""} className="mt-1 block w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500">Media URL</label>
                      <input name="media_url" type="url" defaultValue={exercise.media_url || ""} className="mt-1 block w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500">Instructions</label>
                      <textarea name="instructions" rows={3} defaultValue={exercise.instructions || ""} className="mt-1 block w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 text-sm"></textarea>
                    </div>
                    <button type="submit" className="w-full bg-zinc-800 text-yellow-500 font-bold px-3 py-2 rounded hover:bg-zinc-700 text-xs border border-zinc-700">
                      Save Changes
                    </button>
                  </form>
                </details>
              </div>
            ))
          )}
        </div>

        <div>
          <div className="erp-card sticky top-6">
            <h2 className="text-lg font-bold text-zinc-100 mb-4">Add Exercise</h2>
            <form action={createExercise} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Name</label>
                <input name="name" required className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 text-sm" placeholder="e.g. Barbell Squat" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Category</label>
                <input name="category" className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 text-sm" placeholder="e.g. Legs, Strength" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Media URL</label>
                <input name="media_url" type="url" className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 text-sm" placeholder="e.g. https://example.com/squat.mp4" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Instructions</label>
                <textarea name="instructions" rows={4} className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 text-sm" placeholder="Step-by-step instructions..."></textarea>
              </div>
              <button type="submit" className="w-full bg-yellow-600 text-zinc-900 font-bold px-4 py-2 rounded hover:bg-yellow-500 transition-colors">
                Create Exercise
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
