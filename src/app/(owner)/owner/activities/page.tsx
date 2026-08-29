import { createClient } from "@/utils/supabase/server";
import { createActivity, cancelActivity } from "./actions";

export default async function GroupActivitiesPage() {
  const supabase = await createClient();

  const { data: trainers } = await supabase
    .from("trainers")
    .select("id, name")
    .order("name");

  const { data: activities } = await supabase
    .from("group_activities")
    .select("*, trainers(name)")
    .is("deleted_at", null)
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
              <label className="block text-sm font-medium text-zinc-400">Activity Name</label>
              <input name="name" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:border-yellow-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Trainer</label>
              <select name="trainer_id" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:border-yellow-500">
                <option value="">No Instructor</option>
                {trainers?.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Date & Time</label>
              <input name="start_at" type="datetime-local" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:border-yellow-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400">Duration (min)</label>
                <input name="duration_minutes" type="number" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400">Capacity</label>
                <input name="capacity" type="number" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Location</label>
              <input name="location" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:border-yellow-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Description</label>
              <textarea name="description" rows={2} className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"></textarea>
            </div>
            <button type="submit" className="w-full bg-yellow-600 text-zinc-950 font-bold px-4 py-2 rounded hover:bg-yellow-500 transition-colors">
              Schedule Activity
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 overflow-hidden">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-950">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Schedule</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                {activities?.map((activity) => (
                  <tr key={activity.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-zinc-200">{activity.name}</div>
                      <div className="text-xs text-zinc-500">{activity.trainers?.name || 'Self-led'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                      {new Date(activity.start_at).toLocaleString()} <br/>
                      <span className="text-xs text-zinc-500">{activity.duration_minutes} mins | {activity.location}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                      {activity.capacity} spots
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <form action={async () => { "use server"; await cancelActivity(activity.id); }}>
                        <button type="submit" className="text-red-400 hover:text-red-300">Cancel</button>
                      </form>
                    </td>
                  </tr>
                ))}
                {(!activities || activities.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No active group activities scheduled.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
