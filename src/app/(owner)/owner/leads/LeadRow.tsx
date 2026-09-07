"use client";

import { updateLeadStage, assignLeadTrainer, setLeadFollowUp } from "./actions";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: string;
  stage: string;
  assigned_trainer: string | null;
  follow_up_at: string | null;
  trainers: { name: string } | null;
}

interface Trainer {
  id: string;
  name: string;
}

export function LeadRow({ lead, trainers }: { lead: Lead; trainers: Trainer[] }) {
  return (
    <tr key={lead.id} className="hover:bg-zinc-800/50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-bold text-zinc-200">{lead.name}</div>
        <div className="text-xs text-zinc-500">{lead.phone} | {lead.email}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 capitalize">
        {lead.source}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <form action={updateLeadStage}>
          <input type="hidden" name="id" value={lead.id} />
          <select
            name="stage"
            defaultValue={lead.stage}
            className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-xs border border-zinc-700 capitalize w-full"
            onChange={(e) => e.target.form?.requestSubmit()}
          >
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Trial">Trial</option>
            <option value="Converted">Converted</option>
            <option value="Lost">Lost</option>
          </select>
        </form>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
        <form action={assignLeadTrainer}>
          <input type="hidden" name="id" value={lead.id} />
          <select
            name="trainer_id"
            defaultValue={lead.assigned_trainer || "unassigned"}
            className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-xs border border-zinc-700 w-full"
            onChange={(e) => e.target.form?.requestSubmit()}
          >
            <option value="unassigned">Unassigned</option>
            {trainers?.map((trainer) => (
              <option key={trainer.id} value={trainer.id}>
                {trainer.name}
              </option>
            ))}
          </select>
        </form>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
        <form action={setLeadFollowUp}>
          <input type="hidden" name="id" value={lead.id} />
          <input
            type="date"
            name="follow_up_at"
            defaultValue={lead.follow_up_at ? new Date(lead.follow_up_at).toISOString().split('T')[0] : ''}
            className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-xs border border-zinc-700 w-full"
            onChange={(e) => e.target.form?.requestSubmit()}
          />
        </form>
      </td>
    </tr>
  );
}
