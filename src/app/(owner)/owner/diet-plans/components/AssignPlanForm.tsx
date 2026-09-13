"use client";

import { useState, useTransition } from "react";
import { assignDietPlan } from "../actions";

export default function AssignPlanForm({ members, diet_plan_id }: { members: {id: string, name: string}[], diet_plan_id: string }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssign = (formData: FormData) => {
    setSuccess(false);
    setError(null);
    startTransition(async () => {
      try {
        await assignDietPlan(formData);
        setSuccess(true);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to assign plan");
      }
    });
  };

  return (
    <form action={handleAssign} className="mt-4 pt-4 border-t border-zinc-800">
      <input type="hidden" name="diet_plan_id" value={diet_plan_id} />
      {success && (
        <div role="status" className="mb-2 rounded border border-green-800 bg-green-950/60 px-3 py-2 text-xs text-green-300">
          Plan assigned successfully.
        </div>
      )}
      {error && (
        <div role="alert" className="mb-2 rounded border border-red-800 bg-red-950/60 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}
      <div className="flex space-x-2">
        <select name="member_id" required className="block w-full bg-zinc-950 border border-zinc-700 rounded p-1 text-xs text-zinc-200">
          <option value="">Select Member...</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <button disabled={isPending} type="submit" className="bg-yellow-600 text-zinc-950 text-xs font-bold px-3 py-1 rounded hover:bg-yellow-500">
          {isPending ? 'Assigning...' : 'Assign'}
        </button>
      </div>
      {members.length === 0 && (
        <p className="mt-2 text-xs text-yellow-500/80 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
          No members available to assign.
        </p>
      )}
    </form>
  );
}
