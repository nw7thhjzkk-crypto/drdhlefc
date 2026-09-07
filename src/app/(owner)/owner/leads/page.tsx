import { createClient } from "@/utils/supabase/server";
import {
  addLead,
  updateLeadStage,
  assignLeadTrainer,
  setLeadFollowUp,
} from "./actions";

const STAGES = ["New", "Contacted", "Trial", "Won", "Lost"] as const;

type TrainerRef = { name: string } | null;

type LeadRow = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  stage: string | null;
  follow_up_at: string | null;
  assigned_trainer: string | null;
  trainers: TrainerRef;
};

type TrainerOption = { id: string; name: string | null };

function followUpInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default async function CRMPage() {
  const supabase = await createClient();

  const [{ data: leads }, { data: trainers }] = await Promise.all([
    supabase
      .from("leads")
      .select("*, trainers(name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("trainers")
      .select("id, name")
      .neq("status", "inactive")
      .order("name", { ascending: true }),
  ]);

  const leadRows = (leads ?? []) as LeadRow[];
  const trainerOptions = (trainers ?? []) as TrainerOption[];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-yellow-500">Leads & CRM</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 p-6 h-fit">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4 border-b border-zinc-800 pb-2">
            New Lead
          </h2>
          <form action={addLead} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400">Name</label>
              <input
                name="name"
                required
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Phone</label>
              <input
                name="phone"
                required
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Email</label>
              <input
                name="email"
                type="email"
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Source</label>
              <select
                name="source"
                required
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
              >
                <option value="Walk-in">Walk-in</option>
                <option value="Instagram">Instagram</option>
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Stage</label>
              <select
                name="stage"
                required
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-yellow-600 text-zinc-950 font-bold px-4 py-2 rounded hover:bg-yellow-500 transition-colors"
            >
              Add Lead
            </button>
          </form>
        </div>

        <div className="lg:col-span-3 bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 overflow-hidden">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-950">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Name / Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Follow-Up
                </th>
              </tr>
            </thead>
            <tbody className="bg-zinc-900 divide-y divide-zinc-800">
              {leadRows.map((lead) => (
                <tr key={lead.id} className="hover:bg-zinc-800/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-zinc-200">{lead.name}</div>
                    <div className="text-xs text-zinc-500">
                      {lead.phone} | {lead.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 capitalize">
                    {lead.source}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <form
                      action={updateLeadStage.bind(null, lead.id)}
                      className="flex items-center gap-2"
                    >
                      <select
                        name="stage"
                        defaultValue={lead.stage ?? "New"}
                        className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200"
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="text-xs font-semibold text-yellow-500 hover:text-yellow-400"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                    <form
                      action={assignLeadTrainer.bind(null, lead.id)}
                      className="flex items-center gap-2"
                    >
                      <select
                        name="trainer_id"
                        defaultValue={lead.assigned_trainer ?? ""}
                        className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 max-w-[10rem]"
                      >
                        <option value="">Unassigned</option>
                        {trainerOptions.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="text-xs font-semibold text-yellow-500 hover:text-yellow-400"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                    <form
                      action={setLeadFollowUp.bind(null, lead.id)}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="date"
                        name="follow_up_at"
                        defaultValue={followUpInputValue(lead.follow_up_at)}
                        className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200"
                      />
                      <button
                        type="submit"
                        className="text-xs font-semibold text-yellow-500 hover:text-yellow-400"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {leadRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                    No leads in the pipeline.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
