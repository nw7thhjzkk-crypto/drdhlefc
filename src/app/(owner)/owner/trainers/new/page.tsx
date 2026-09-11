"use client";

import { createTrainer } from "../actions";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFormMutation } from "@/hooks/useFormMutation";

export default function NewTrainerPage() {
  const router = useRouter();

  const { handleSubmit, isPending: loading, error } = useFormMutation(
    createTrainer,
    (res: { trainerId?: string }) => {
      if (res.trainerId) {
        router.push(`/owner/trainers/${res.trainerId}`);
      }
    }
  );

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Add New Trainer</h1>
        <Link href="/owner/trainers" className="text-yellow-500 hover:underline">Back to Trainers</Link>
      </div>

      {error && <div className="bg-red-950/60 text-red-300 p-4 rounded mb-6">{error}</div>}

      <form action={handleSubmit} className="bg-zinc-900 p-6 rounded-lg shadow-xl border border-zinc-800 space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400">Name *</label>
            <input name="name" type="text" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400">Email *</label>
            <input name="email" type="email" required className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400">Phone</label>
            <input name="phone" type="text" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400">Joining Date</label>
            <input name="joining_date" type="date" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400">Qualification</label>
            <input name="qualification" type="text" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400">Specialization</label>
            <input name="specialization" type="text" placeholder="e.g. Weightlifting, Yoga" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400">Photo</label>
            <input name="photo" type="file" accept="image/*" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
          </div>
        </div>

        <h3 className="text-lg font-medium text-zinc-100 border-b pb-2 pt-4">Salary Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400">Basic Salary</label>
            <input name="salary_basic" type="number" step="0.01" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400">Allowances</label>
            <input name="salary_allowances" type="number" step="0.01" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400">Deductions</label>
            <input name="salary_deductions" type="number" step="0.01" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400">Notes</label>
          <textarea name="notes" rows={2} className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"></textarea>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-yellow-600 text-zinc-950 font-bold px-6 py-2 rounded shadow hover:bg-yellow-500 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Trainer"}
          </button>
        </div>
      </form>
    </div>
  );
}
