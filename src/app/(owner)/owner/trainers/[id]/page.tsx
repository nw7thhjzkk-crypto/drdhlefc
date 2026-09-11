import { createClient } from "@/utils/supabase/server";
import { updateTrainer } from "../actions";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { QueryData } from "@supabase/supabase-js";

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

  type TrainerWithMembers = QueryData<typeof trainerQuery>;

  const { data: trainer, error } = await trainerQuery;

  if (error || !trainer) {
    redirect("/owner/trainers");
  }

  const memberTrainers = trainer.member_trainers as NonNullable<TrainerWithMembers["member_trainers"]>;

  type MemberTrainerType = NonNullable<TrainerWithMembers["member_trainers"]>[number];
  // Extracting the item type cleanly whether it's an array or not, without using 'any'.
  type MemberType = MemberTrainerType["members"] extends (infer U)[] ? U : MemberTrainerType["members"];

  const assignedMembers = memberTrainers
    ?.map((mt: MemberTrainerType) => (Array.isArray(mt.members) ? mt.members[0] : mt.members) as MemberType)
    .filter((m: MemberType | null | undefined): m is NonNullable<MemberType> => Boolean(m)) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/owner/trainers" className="text-zinc-500 hover:text-zinc-100">&larr; Back</Link>
          <h1 className="text-2xl font-bold text-zinc-100">Trainer Profile: {trainer.name}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Form */}
        <div className="lg:col-span-2 bg-zinc-900 p-6 rounded-lg shadow-xl border border-zinc-800">
          <h2 className="text-xl font-semibold mb-6 border-b pb-2">Details</h2>

          <form action={async (formData) => {
            "use server";
            await updateTrainer(id, formData);
          }} className="space-y-6">

            <div className="flex items-center gap-6 mb-6">
              <div className="w-24 h-24 relative bg-zinc-800 rounded-full overflow-hidden flex-shrink-0">
                {trainer.photo_url ? (
                  <Image src={trainer.photo_url} alt={trainer.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex justify-center items-center text-zinc-500 text-2xl">?</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400">Update Photo</label>
                <input name="photo" type="file" accept="image/*" className="mt-1 block text-sm text-zinc-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400">Name</label>
                <input name="name" type="text" defaultValue={trainer.name} className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400">Email</label>
                <input name="email" type="email" defaultValue={trainer.email} className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400">Phone</label>
                <input name="phone" type="text" defaultValue={trainer.phone || ""} className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400">Joining Date</label>
                <input name="joining_date" type="date" defaultValue={trainer.joining_date || ""} className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400">Qualification</label>
                <input name="qualification" type="text" defaultValue={trainer.qualification || ""} className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400">Specialization</label>
                <input name="specialization" type="text" defaultValue={trainer.specialization || ""} className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400">Status</label>
                <select name="status" defaultValue={trainer.status} className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <h3 className="text-lg font-medium text-zinc-100 border-b pb-2 pt-4">Salary Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400">Basic Salary</label>
                <input name="salary_basic" type="number" step="0.01" defaultValue={trainer.salary_basic || ""} className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400">Allowances</label>
                <input name="salary_allowances" type="number" step="0.01" defaultValue={trainer.salary_allowances || ""} className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400">Deductions</label>
                <input name="salary_deductions" type="number" step="0.01" defaultValue={trainer.salary_deductions || ""} className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400">Internal Notes</label>
              <textarea name="notes" rows={2} defaultValue={trainer.notes || ""} className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"></textarea>
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" className="bg-yellow-600 text-zinc-950 font-bold px-6 py-2 rounded shadow hover:bg-yellow-500">
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Assigned Members */}
        <div className="space-y-6">
          <div className="bg-zinc-900 p-6 rounded-lg shadow-xl border border-zinc-800">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Assigned Members ({assignedMembers.length})</h2>
            {assignedMembers.length > 0 ? (
              <ul className="space-y-3">
                {assignedMembers.map((m: NonNullable<MemberType>) => (
                  <li key={m.id} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{m.name}</p>
                      <p className="text-xs text-zinc-500">{m.member_code}</p>
                    </div>
                    <Link href={`/owner/members/${m.id}`} className="text-xs text-yellow-500 hover:underline">
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-zinc-500 text-sm">No members assigned currently.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
