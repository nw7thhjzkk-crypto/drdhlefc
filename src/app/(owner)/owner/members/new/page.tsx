"use client";

import { createMember } from "../actions";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFormMutation } from "@/hooks/useFormMutation";

export default function NewMemberPage() {
  const router = useRouter();

  const { handleSubmit, isPending: loading, error } = useFormMutation(
    createMember,
    (res: { memberId?: string }) => {
      if (res.memberId) {
        router.push(`/owner/members/${res.memberId}`);
      }
    }
  );

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Member</h1>
        <Link href="/owner/members" className="text-blue-600 hover:underline">Back to Members</Link>
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
            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
            <input name="dob" type="date" className="mt-1 block w-full border border-gray-300 rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Gender</label>
            <select name="gender" className="mt-1 block w-full border border-gray-300 rounded p-2">
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Photo</label>
            <input name="photo" type="file" accept="image/*" className="mt-1 block w-full border border-gray-300 rounded p-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <textarea name="address" rows={2} className="mt-1 block w-full border border-gray-300 rounded p-2"></textarea>
        </div>

        <h3 className="text-lg font-medium text-gray-900 border-b pb-2 pt-4">Emergency Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input name="emergency_contact_name" type="text" className="mt-1 block w-full border border-gray-300 rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input name="emergency_contact_phone" type="text" className="mt-1 block w-full border border-gray-300 rounded p-2" />
          </div>
        </div>

        <h3 className="text-lg font-medium text-gray-900 border-b pb-2 pt-4">Fitness Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Primary Goal</label>
            <input name="primary_goal" type="text" placeholder="e.g. Weight Loss" className="mt-1 block w-full border border-gray-300 rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Secondary Goal</label>
            <input name="secondary_goal" type="text" className="mt-1 block w-full border border-gray-300 rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fitness Level</label>
            <select name="fitness_level" className="mt-1 block w-full border border-gray-300 rounded p-2">
              <option value="">Select...</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Diet Preference</label>
            <input name="diet_preference" type="text" className="mt-1 block w-full border border-gray-300 rounded p-2" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Training Experience / Injuries</label>
            <textarea name="training_experience" rows={2} className="mt-1 block w-full border border-gray-300 rounded p-2"></textarea>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Internal Notes</label>
            <textarea name="notes" rows={2} className="mt-1 block w-full border border-gray-300 rounded p-2"></textarea>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Member"}
          </button>
        </div>
      </form>
    </div>
  );
}
