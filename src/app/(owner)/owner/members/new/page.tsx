"use client";

import { Suspense } from "react";
import { createMember } from "../actions";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useFormMutation } from "@/hooks/useFormMutation";

function NewMemberForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const leadId = searchParams.get("lead_id") ?? "";
  const defaultName = searchParams.get("name") ?? "";
  const defaultPhone = searchParams.get("phone") ?? "";
  const defaultEmail = searchParams.get("email") ?? "";
  const convertingFromLead = Boolean(leadId || defaultName || defaultPhone || defaultEmail);

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
        <h1 className="text-2xl font-bold text-zinc-100">Add New Member</h1>
        <Link href="/owner/members" className="text-yellow-500 hover:underline">Back to Members</Link>
      </div>

      {convertingFromLead && (
        <div className="bg-yellow-950/40 border border-yellow-800 text-yellow-300 p-4 rounded mb-6 text-sm">
          Converting CRM lead{leadId ? ` (${leadId})` : ""} — name, phone, and email are prefilled. Complete the form and create the member.
          {" "}
          <Link href="/owner/leads" className="underline font-medium">Back to leads</Link>
        </div>
      )}

      {error && <div className="bg-red-950/60 text-red-300 p-4 rounded mb-6">{error}</div>}

      <form action={handleSubmit} className="bg-zinc-900 p-6 rounded-lg shadow-xl border border-zinc-800 space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400">Name *</label>
            <input name="name" type="text" required defaultValue={defaultName} className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400">Email *</label>
            <input name="email" type="email" required defaultValue={defaultEmail} className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400">Phone</label>
            <input name="phone" type="text" defaultValue={defaultPhone} className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400">Date of Birth</label>
            <input name="dob" type="date" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400">Gender</label>
            <select name="gender" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200">
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400">Photo</label>
            <input name="photo" type="file" accept="image/*" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400">Address</label>
          <textarea name="address" rows={2} className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"></textarea>
        </div>

        <h3 className="text-lg font-medium text-zinc-100 border-b pb-2 pt-4">Emergency Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400">Name</label>
            <input name="emergency_contact_name" type="text" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400">Phone</label>
            <input name="emergency_contact_phone" type="text" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
          </div>
        </div>

        <h3 className="text-lg font-medium text-zinc-100 border-b pb-2 pt-4">Fitness Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400">Primary Goal</label>
            <input name="primary_goal" type="text" placeholder="e.g. Weight Loss" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400">Secondary Goal</label>
            <input name="secondary_goal" type="text" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400">Fitness Level</label>
            <select name="fitness_level" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200">
              <option value="">Select...</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400">Diet Preference</label>
            <input name="diet_preference" type="text" className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-zinc-400">Training Experience / Injuries</label>
            <textarea name="training_experience" rows={2} className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"></textarea>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-zinc-400">Internal Notes</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={leadId ? `Converted from CRM lead ${leadId}` : ""}
              className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
            ></textarea>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-yellow-600 text-zinc-950 font-bold px-6 py-2 rounded shadow hover:bg-yellow-500 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Member"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewMemberPage() {
  return (
    <Suspense fallback={<div className="p-8 max-w-3xl mx-auto text-zinc-500">Loading form…</div>}>
      <NewMemberForm />
    </Suspense>
  );
}
