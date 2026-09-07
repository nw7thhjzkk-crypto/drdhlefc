"use client";

import { createPlan, updatePlan, seedStarterMembershipPlans } from "./actions";
import { useState, useRef } from "react";

export interface MembershipPlan {
  id: string;
  name: string;
  duration_days: number;
  price: number;
  plan_type: string;
  description: string;
  status: string;
}

function formatInr(price: number) {
  return `₹${Number(price).toLocaleString("en-IN")}`;
}

export default function PlansClient({ plans }: { plans: MembershipPlan[] }) {
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleCreate(formData: FormData) {
    const result = await createPlan(formData);
    if (result?.success) {
      formRef.current?.reset();
    }
  }

  async function handleUpdate(formData: FormData) {
    if (editingPlan) {
      const result = await updatePlan(editingPlan.id, formData);
      if (result?.success) {
        setEditingPlan(null);
      }
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-yellow-500">Membership Plans</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-zinc-900 p-6 rounded-lg shadow-xl border border-zinc-800 h-fit">
          <h2 className="text-lg font-semibold mb-4 border-b border-zinc-800 pb-2 text-zinc-100">
            {editingPlan ? "Edit Plan" : "Create New Plan"}
          </h2>
          <form key={editingPlan?.id || "new"} ref={formRef} action={editingPlan ? handleUpdate : handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400">Plan Name</label>
              <input name="name" type="text" defaultValue={editingPlan?.name || ""} required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:border-yellow-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Duration (Days)</label>
              <input name="duration_days" type="number" defaultValue={editingPlan?.duration_days || ""} required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:border-yellow-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Price (₹)</label>
              <input name="price" type="number" step="0.01" defaultValue={editingPlan?.price || ""} required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:border-yellow-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Plan Type</label>
              <input name="plan_type" type="text" placeholder="e.g., Standard, Premium" defaultValue={editingPlan?.plan_type || ""} required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:border-yellow-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">Description</label>
              <textarea name="description" rows={3} defaultValue={editingPlan?.description || ""} className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 focus:border-yellow-500"></textarea>
            </div>
            {editingPlan && (
              <div>
                <label className="block text-sm font-medium text-zinc-400">Status</label>
                <select name="status" defaultValue={editingPlan.status} className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
            <div className="flex gap-2">
              <button type="submit" className="w-full bg-yellow-600 text-zinc-950 font-bold px-4 py-2 rounded hover:bg-yellow-500 transition-colors">
                {editingPlan ? "Update Plan" : "Create Plan"}
              </button>
              {editingPlan && (
                <button type="button" onClick={() => setEditingPlan(null)} className="w-full bg-zinc-800 text-zinc-200 px-4 py-2 rounded hover:bg-zinc-700 border border-zinc-700">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="md:col-span-2">
          {plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-10 text-center shadow-xl">
              <h3 className="text-lg font-semibold text-yellow-500">No Membership Plans</h3>
              <p className="max-w-md text-sm text-zinc-500">
                Get started quickly by generating a set of standard membership plans for your gym.
              </p>
              <form action={seedStarterMembershipPlans}>
                <button
                  type="submit"
                  className="bg-zinc-800 text-yellow-500 font-bold px-4 py-2 rounded hover:bg-zinc-700 transition-colors border border-zinc-700"
                >
                  Generate Starter Plans
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 overflow-hidden">
              <table className="min-w-full divide-y divide-zinc-800">
                <thead className="bg-zinc-950">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Plan Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                  {plans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-zinc-950/60">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-zinc-100">{plan.name}</div>
                        <div className="text-sm text-zinc-500">{plan.plan_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                        {plan.duration_days} Days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-yellow-500">
                        {formatInr(plan.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          plan.status === "active"
                            ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                            : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                        }`}>
                          {plan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onClick={() => setEditingPlan(plan)} className="text-yellow-500 hover:text-yellow-400">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
