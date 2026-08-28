import { createClient } from "@/utils/supabase/server";
import { updateTrainer } from "../actions";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { type QueryData } from "@supabase/supabase-js";

export default async function TrainerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  const trainerQuery = supabase
    .from("trainers")
    .select(`
      *,
      member_trainers(is_primary, members(id, name, member_code, status))
    `)
    .eq("id", id)
    .single();

  type TrainerData = QueryData<typeof trainerQuery>;
  const { data: trainer, error } = await trainerQuery;

  if (error || !trainer) {
    redirect("/owner/trainers");
  }

  // Use inferred type for trainer
  const trainerData = trainer as unknown as TrainerData;
  const memberTrainers = trainerData.member_trainers || [];
  const assignedMembers = (Array.isArray(memberTrainers) ? memberTrainers : [memberTrainers]).map(mt => {
    return Array.isArray(mt.members) ? mt.members[0] : mt.members;
  }).filter(Boolean);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/owner/trainers" className="text-gray-500 hover:text-gray-900">&larr; Back</Link>
          <h1 className="text-2xl font-bold text-gray-900">Trainer Profile: {trainer.name}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Form */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6 border-b pb-2">Details</h2>

          <form action={async (formData) => {
            "use server";
            await updateTrainer(id, formData);
          }} className="space-y-6">

            <div className="flex items-center gap-6 mb-6">
              <div className="w-24 h-24 relative bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                {trainer.photo_url ? (
                  <Image src={trainer.photo_url} alt={trainer.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex justify-center items-center text-gray-500 text-2xl">?</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Update Photo</label>
                <input name="photo" type="file" accept="image/*" className="mt-1 block text-sm text-gray-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input name="name" type="text" defaultValue={trainer.name} className="mt-1 block w-full border border-gray-300 rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input name="email" type="email" defaultValue={trainer.email} className="mt-1 block w-full border border-gray-300 rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input name="phone" type="text" defaultValue={trainer.phone || ""} className="mt-1 block w-full border border-gray-300 rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                <input name="joining_date" type="date" defaultValue={trainer.joining_date || ""} className="mt-1 block w-full border border-gray-300 rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Qualification</label>
                <input name="qualification" type="text" defaultValue={trainer.qualification || ""} className="mt-1 block w-full border border-gray-300 rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Specialization</label>
                <input name="specialization" type="text" defaultValue={trainer.specialization || ""} className="mt-1 block w-full border border-gray-300 rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select name="status" defaultValue={trainer.status} className="mt-1 block w-full border border-gray-300 rounded p-2">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 pt-4">Salary Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Basic Salary</label>
                <input name="salary_basic" type="number" step="0.01" defaultValue={trainer.salary_basic || ""} className="mt-1 block w-full border border-gray-300 rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Allowances</label>
                <input name="salary_allowances" type="number" step="0.01" defaultValue={trainer.salary_allowances || ""} className="mt-1 block w-full border border-gray-300 rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Deductions</label>
                <input name="salary_deductions" type="number" step="0.01" defaultValue={trainer.salary_deductions || ""} className="mt-1 block w-full border border-gray-300 rounded p-2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Internal Notes</label>
              <textarea name="notes" rows={2} defaultValue={trainer.notes || ""} className="mt-1 block w-full border border-gray-300 rounded p-2"></textarea>
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700">
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Assigned Members */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Assigned Members ({assignedMembers.length})</h2>
            {assignedMembers.length > 0 ? (
              <ul className="space-y-3">
                {assignedMembers.map(m => m && (
                  <li key={m.id} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{m.name}</p>
                      <p className="text-xs text-gray-500">{m.member_code}</p>
                    </div>
                    <Link href={`/owner/members/${m.id}`} className="text-xs text-blue-600 hover:underline">
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No members assigned currently.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
