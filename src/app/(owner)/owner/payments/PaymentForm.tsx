"use client";

import { useState } from "react";
import { recordPayment } from "./actions";

interface MembershipPlan {
  name: string;
}

interface Membership {
  id: string;
  status: string;
  pending_amount: number;
  membership_plans: MembershipPlan | MembershipPlan[] | null;
}

interface Member {
  id: string;
  name: string;
  memberships: Membership[] | null;
}

export default function PaymentForm({ membersWithMemberships }: { membersWithMemberships: Member[] }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await recordPayment(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess(true);
        // Reset form would normally go here, but using simple server action for now
        // A full reset might need a ref, so we'll just show success.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 p-6 h-fit">
      <h2 className="text-lg font-semibold text-zinc-100 mb-4 border-b border-zinc-800 pb-2">Record Payment</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-900/50 border border-green-500 rounded text-green-200 text-sm">
          Payment recorded successfully!
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-400">Member</label>
          <select name="member_id" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200">
            <option value="">Select Member...</option>
            {membersWithMemberships?.filter(m => m.memberships && m.memberships.length > 0).map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400">Membership</label>
          <select name="membership_id" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200">
            <option value="">Select Membership...</option>
            {membersWithMemberships?.map(m =>
              m.memberships?.map((ms: Membership) => {
                const planName = Array.isArray(ms.membership_plans) ? ms.membership_plans[0]?.name : ms.membership_plans?.name;
                return (
                  <option key={ms.id} value={ms.id}>{m.name} - {planName} (${ms.pending_amount} pending)</option>
                );
              })
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400">Amount</label>
          <input name="amount" type="number" step="0.01" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-400">Method</label>
          <select name="method" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200">
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-400">Reference / Txn ID</label>
          <input name="reference" type="text" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-400">Notes</label>
          <textarea name="notes" rows={2} className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"></textarea>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-yellow-600 text-zinc-950 font-bold px-4 py-2 rounded hover:bg-yellow-500 transition-colors disabled:opacity-50"
        >
          {isPending ? "Recording..." : "Record Payment"}
        </button>
      </form>
    </div>
  );
}
