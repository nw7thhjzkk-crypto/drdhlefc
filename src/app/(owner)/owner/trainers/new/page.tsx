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
        <h1 className="text-2xl font-bold text-gray-900">Add New Trainer</h1>
        <Link href="/owner/trainers" className="text-blue-600 hover:underline">Back to Trainers</Link>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded mb-6">{error}</div>}

      <form action={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input name="name" type="text" required className="mt-1 block w-full border border-gray-300 rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email *</label>
            <input name="email" type="email" required className="mt-1 block w-full border border-gray-300 rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input name="phone" type="text" className="mt-1 block w-full border border-gray-300 rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Joining Date</label>
            <input name="joining_date" type="date" className="mt-1 block w-full border border-gray-300 rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Qualification</label>
            <input name="qualification" type="text" className="mt-1 block w-full border border-gray-300 rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Specialization</label>
            <input name="specialization" type="text" placeholder="e.g. Weightlifting, Yoga" className="mt-1 block w-full border border-gray-300 rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Photo</label>
            <input name="photo" type="file" accept="image/*" className="mt-1 block w-full border border-gray-300 rounded p-2" />
          </div>
        </div>

        <h3 className="text-lg font-medium text-gray-900 border-b pb-2 pt-4">Salary Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Basic Salary</label>
            <input name="salary_basic" type="number" step="0.01" className="mt-1 block w-full border border-gray-300 rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Allowances</label>
            <input name="salary_allowances" type="number" step="0.01" className="mt-1 block w-full border border-gray-300 rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Deductions</label>
            <input name="salary_deductions" type="number" step="0.01" className="mt-1 block w-full border border-gray-300 rounded p-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea name="notes" rows={2} className="mt-1 block w-full border border-gray-300 rounded p-2"></textarea>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Trainer"}
          </button>
        </div>
      </form>
    </div>
  );
}
