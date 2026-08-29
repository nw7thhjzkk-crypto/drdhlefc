"use client";

import { useTransition } from "react";
import { assignWorkoutPlan } from "../actions";

export default function AssignPlanForm({ members, workout_plan_id }: { members: {id: string, name: string}[], workout_plan_id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleAssign = (formData: FormData) => {
    startTransition(async () => {
      await assignWorkoutPlan(formData);
      alert("Plan assigned to member successfully!");
    });
  };

  return (
    <form action={handleAssign} className="mt-4 pt-4 border-t border-zinc-800">
      <input type="hidden" name="workout_plan_id" value={workout_plan_id} />
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
    </form>
  );
}
