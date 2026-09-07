import { createClient } from "@/utils/supabase/server";
import { saveGymSettings } from "./actions";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") {
    redirect("/login");
  }

  const { data: settings } = await supabase
    .from("gym_settings")
    .select("*")
    .eq("id", "00000000-0000-0000-0000-000000000000")
    .single();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <h1 className="text-2xl font-bold text-yellow-500">Gym Settings</h1>
      </div>

      <div className="bg-zinc-900 p-8 rounded-lg shadow-xl border border-zinc-800">
        <h2 className="text-xl font-semibold mb-6 text-zinc-200">Club Information</h2>
        <form action={saveGymSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400">Club Name</label>
              <input
                name="club_name"
                type="text"
                defaultValue={settings?.club_name || "Dr DHL Elite Fitness Club"}
                required
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Support Email</label>
              <input
                name="support_email"
                type="email"
                defaultValue={settings?.support_email || "admin@drdhlelite.com"}
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:border-yellow-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400">Club Address</label>
            <textarea
              name="club_address"
              rows={3}
              defaultValue={settings?.club_address || "123 Elite Avenue, Fitness City"}
              className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:border-yellow-500"
            ></textarea>
          </div>

          <h2 className="text-xl font-semibold mt-8 mb-6 text-zinc-200 border-t border-zinc-800 pt-6">Branding & Features</h2>

          <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded">
            <div>
              <p className="font-medium text-zinc-200">Premium Theme</p>
              <p className="text-sm text-zinc-500">Enable Black, Gold, and Silver styling across all modules.</p>
            </div>
            <input
              name="premium_theme"
              type="checkbox"
              defaultChecked={settings ? settings.premium_theme : true}
              className="h-5 w-5 rounded text-yellow-500 focus:ring-yellow-500 bg-zinc-900 border-zinc-700"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded mt-4">
            <div>
              <p className="font-medium text-zinc-200">Gemini AI Features</p>
              <p className="text-sm text-zinc-500">Enable AI-generated diet plans, workouts, and analytics insights.</p>
            </div>
            <input
              name="gemini_ai_enabled"
              type="checkbox"
              defaultChecked={settings ? settings.gemini_ai_enabled : false}
              className="h-5 w-5 rounded text-yellow-500 focus:ring-yellow-500 bg-zinc-900 border-zinc-700"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded mt-4">
            <div>
              <p className="font-medium text-zinc-200">Google Drive Integration</p>
              <p className="text-sm text-zinc-500">Store assessment photos automatically in connected Drive folder.</p>
            </div>
            <input
              name="google_drive_enabled"
              type="checkbox"
              defaultChecked={settings ? settings.google_drive_enabled : false}
              className="h-5 w-5 rounded text-yellow-500 focus:ring-yellow-500 bg-zinc-900 border-zinc-700"
            />
          </div>

          <div className="pt-6 flex justify-end">
            <button type="submit" className="bg-yellow-600 text-zinc-950 font-bold px-6 py-2 rounded hover:bg-yellow-500 transition-colors shadow-lg">
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
