import { createClient } from "@/utils/supabase/server";
import { addLead, updateLead } from "./actions";

export default async function CRMPage() {
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from("leads")
    .select("*, trainers(name)")
    .order("created_at", { ascending: false });

  const { data: trainers } = await supabase
    .from("trainers")
    .select("id, name")

    .order("name", { ascending: true });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-yellow-500">Leads & CRM</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Add Lead Form */}
        <div className="lg:col-span-1 bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 p-6 h-fit">
            <h2 className="text-lg font-semibold text-zinc-100 mb-4 border-b border-zinc-800 pb-2">New Lead</h2>
            <form action={addLead} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-400">Name</label>
                    <input name="name" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400">Phone</label>
                    <input name="phone" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400">Email</label>
                    <input name="email" type="email" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400">Source</label>
                    <select name="source" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200">
                        <option value="Walk-in">Walk-in</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Website">Website</option>
                        <option value="Referral">Referral</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400">Stage</label>
                    <select name="stage" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200">
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="trial">Trial</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                    </select>
                </div>
                <button type="submit" className="w-full bg-yellow-600 text-zinc-950 font-bold px-4 py-2 rounded hover:bg-yellow-500 transition-colors">
                    Add Lead
                </button>
            </form>
        </div>

        <div className="lg:col-span-3 bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 overflow-hidden">
            <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-950">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Name / Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Stage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Follow-Up</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                {leads?.map((lead) => (
                <tr key={lead.id} className="hover:bg-zinc-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-zinc-200">{lead.name}</div>
                    <div className="text-xs text-zinc-500">{lead.phone} | {lead.email}</div>
                    <form id={`form-${lead.id}`} action={updateLead} className="hidden">
                        <input type="hidden" name="id" value={lead.id} />
                    </form>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 capitalize">
                    {lead.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <select
                        name="stage"
                        form={`form-${lead.id}`}
                        defaultValue={lead.stage}
                        className="bg-zinc-950 border border-zinc-800 rounded p-1 text-zinc-200 text-xs w-full max-w-[120px]"
                    >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="trial">Trial</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                    </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                    <select
                        name="assigned_trainer"
                        form={`form-${lead.id}`}
                        defaultValue={lead.assigned_trainer || ""}
                        className="bg-zinc-950 border border-zinc-800 rounded p-1 text-zinc-200 text-xs w-full max-w-[140px]"
                    >
                        <option value="">Unassigned</option>
                        {trainers?.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                    <input
                        type="date"
                        name="follow_up_at"
                        form={`form-${lead.id}`}
                        defaultValue={lead.follow_up_at ? new Date(lead.follow_up_at).toISOString().split('T')[0] : ""}
                        className="bg-zinc-950 border border-zinc-800 rounded p-1 text-zinc-200 text-xs w-full max-w-[140px] [&::-webkit-calendar-picker-indicator]:invert"
                    />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                    <button type="submit" form={`form-${lead.id}`} className="bg-zinc-800 text-yellow-500 hover:bg-zinc-700 px-3 py-1 rounded text-xs font-bold transition-colors">
                        Save
                    </button>
                    </td>
                </tr>
                ))}
                {(!leads || leads.length === 0) && (
                <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">No leads in the pipeline.</td>
                </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
