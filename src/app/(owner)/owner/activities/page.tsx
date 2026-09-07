import { createClient } from "@/utils/supabase/server";
import { createActivity, cancelActivity, updateActivity } from "./actions";

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function GroupActivitiesPage() {
  const supabase = await createClient();

  const { data: trainers } = await supabase
    .from("trainers")
    .select("id, name")
    .order("name");

  // Live schema has no deleted_at — hide cancelled via status.
  const { data: activities } = await supabase
    .from("group_activities")
    .select("*, trainers(name)")
    .neq("status", "cancelled")
    .order("start_at", { ascending: true });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-yellow-500">Group Activities</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-zinc-900 p-6 rounded-lg shadow-xl border border-zinc-800 h-fit">
          <h2 className="text-lg font-semibold mb-4 border-b border-zinc-800 pb-2 text-zinc-100">
            Create Activity
          </h2>
          <form action={createActivity} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400">
                Activity Name
              </label>
              <input
                name="name"
                required
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">
                Trainer
              </label>
              <select
                name="trainer_id"
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:border-yellow-500"
              >
                <option value="">No Instructor</option>
                {trainers?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">
                Date & Time
              </label>
              <input
                name="start_at"
                type="datetime-local"
                required
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:border-yellow-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400">
                  Duration (min)
                </label>
                <input
                  name="duration_minutes"
                  type="number"
                  min="1"
                  required
                  className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400">
                  Capacity
                </label>
                <input
                  name="capacity"
                  type="number"
                  min="1"
                  required
                  className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">
                Location
              </label>
              <input
                name="location"
                required
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">
                Description
              </label>
              <textarea
                name="description"
                rows={2}
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-yellow-600 text-zinc-950 font-bold px-4 py-2 rounded hover:bg-yellow-500 transition-colors"
            >
              Schedule Activity
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 overflow-hidden">
            <div className="divide-y divide-zinc-800">
              {activities?.map((activity) => (
                <div key={activity.id} className="px-6 py-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-zinc-200">
                        {activity.name}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {activity.trainers?.name || "Self-led"} ·{" "}
                        {new Date(activity.start_at).toLocaleString()} ·{" "}
                        {activity.duration_minutes} mins · {activity.location} ·{" "}
                        {activity.capacity} spots
                      </div>
                      {activity.description ? (
                        <div className="text-xs text-zinc-600 mt-1">
                          {activity.description}
                        </div>
                      ) : null}
                    </div>
                    <form
                      action={async () => {
                        "use server";
                        await cancelActivity(activity.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-red-400 hover:text-red-300 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </form>
                  </div>

                  <details className="group">
                    <summary className="cursor-pointer text-xs text-zinc-400 hover:text-yellow-500 list-none">
                      Edit activity
                    </summary>
                    <form
                      action={async (formData) => {
                        "use server";
                        await updateActivity(activity.id, formData);
                      }}
                      className="mt-3 grid grid-cols-2 gap-2 text-sm"
                    >
                      <div className="col-span-2">
                        <label className="block text-xs text-zinc-500">Name</label>
                        <input
                          name="name"
                          defaultValue={activity.name ?? ""}
                          required
                          className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-zinc-500">
                          Trainer
                        </label>
                        <select
                          name="trainer_id"
                          defaultValue={activity.trainer_id ?? ""}
                          className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                        >
                          <option value="">No Instructor</option>
                          {trainers?.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-zinc-500">
                          Date & Time
                        </label>
                        <input
                          name="start_at"
                          type="datetime-local"
                          defaultValue={toDatetimeLocalValue(activity.start_at)}
                          required
                          className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500">
                          Duration (min)
                        </label>
                        <input
                          name="duration_minutes"
                          type="number"
                          min="1"
                          defaultValue={activity.duration_minutes ?? 60}
                          required
                          className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500">
                          Capacity
                        </label>
                        <input
                          name="capacity"
                          type="number"
                          min="1"
                          defaultValue={activity.capacity ?? 1}
                          required
                          className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-zinc-500">
                          Location
                        </label>
                        <input
                          name="location"
                          defaultValue={activity.location ?? ""}
                          required
                          className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-zinc-500">
                          Description
                        </label>
                        <textarea
                          name="description"
                          rows={2}
                          defaultValue={activity.description ?? ""}
                          className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                        />
                      </div>
                      <div className="col-span-2">
                        <button
                          type="submit"
                          className="w-full bg-yellow-600 text-zinc-950 font-bold px-3 py-2 rounded hover:bg-yellow-500 text-sm"
                        >
                          Save activity
                        </button>
                      </div>
                    </form>
                  </details>
                </div>
              ))}
              {(!activities || activities.length === 0) && (
                <div className="px-6 py-8 text-center text-zinc-500">
                  No active group activities scheduled.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
