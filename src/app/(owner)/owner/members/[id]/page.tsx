import { createClient } from "@/utils/supabase/server";
import { updateMember, archiveMember, addAssessment } from "../actions";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: member, error } = await supabase
    .from("members")
    .select(`
      *,
      member_trainers(trainer_id, trainers(name)),
      memberships(id, start_date, end_date, status, payments(amount, method), membership_plans(name)),
      assessments(*)
    `)
    .eq("id", id)
    .single();

  if (error || !member) {
    redirect("/owner/members");
  }


  const trainer = member.member_trainers?.[0]?.trainers;

  const membership = member.memberships?.[0];
  const assessments = member.assessments || [];
  const latestAssessment = assessments.sort((a: {recorded_at: string}, b: {recorded_at: string}) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/owner/members" className="text-gray-500 hover:text-gray-900">&larr; Back</Link>
          <h1 className="text-2xl font-bold text-gray-900">Member Profile: {member.member_code}</h1>
        </div>
        {member.status === 'active' && (
          <form action={async () => {
            "use server";
            await archiveMember(id);
          }}>
            <button type="submit" className="bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200">
              Archive Member
            </button>
          </form>
        )}
        {member.status === 'inactive' && (
          <span className="bg-red-100 text-red-800 px-4 py-2 rounded font-semibold">Archived (Inactive)</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Form */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6 border-b pb-2">Details</h2>

          <form action={async (formData) => {
            "use server";
            await updateMember(id, formData);
          }} className="space-y-6">

            <div className="flex items-center gap-6 mb-6">
              <div className="w-24 h-24 relative bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                {member.photo_url ? (
                  <Image src={member.photo_url} alt={member.name} fill className="object-cover" />
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
                <input name="name" type="text" defaultValue={member.name} className="mt-1 block w-full border border-gray-300 rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input name="email" type="email" defaultValue={member.email} className="mt-1 block w-full border border-gray-300 rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input name="phone" type="text" defaultValue={member.phone || ""} className="mt-1 block w-full border border-gray-300 rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input name="dob" type="date" defaultValue={member.dob || ""} className="mt-1 block w-full border border-gray-300 rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select name="gender" defaultValue={member.gender || ""} className="mt-1 block w-full border border-gray-300 rounded p-2">
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <textarea name="address" rows={2} defaultValue={member.address || ""} className="mt-1 block w-full border border-gray-300 rounded p-2"></textarea>
            </div>

            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 pt-4">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input name="emergency_contact_name" type="text" defaultValue={member.emergency_contact_name || ""} className="mt-1 block w-full border border-gray-300 rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input name="emergency_contact_phone" type="text" defaultValue={member.emergency_contact_phone || ""} className="mt-1 block w-full border border-gray-300 rounded p-2" />
              </div>
            </div>

            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 pt-4">Fitness Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Primary Goal</label>
                <input name="primary_goal" type="text" defaultValue={member.primary_goal || ""} className="mt-1 block w-full border border-gray-300 rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Secondary Goal</label>
                <input name="secondary_goal" type="text" defaultValue={member.secondary_goal || ""} className="mt-1 block w-full border border-gray-300 rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fitness Level</label>
                <select name="fitness_level" defaultValue={member.fitness_level || ""} className="mt-1 block w-full border border-gray-300 rounded p-2">
                  <option value="">Select...</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Diet Preference</label>
                <input name="diet_preference" type="text" defaultValue={member.diet_preference || ""} className="mt-1 block w-full border border-gray-300 rounded p-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Training Experience / Injuries</label>
                <textarea name="training_experience" rows={2} defaultValue={member.training_experience || ""} className="mt-1 block w-full border border-gray-300 rounded p-2"></textarea>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Internal Notes</label>
                <textarea name="notes" rows={2} defaultValue={member.notes || ""} className="mt-1 block w-full border border-gray-300 rounded p-2"></textarea>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700">
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Summaries & Assessments */}
        <div className="space-y-6">

          {/* Membership Summary */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Membership</h2>
            {membership ? (
              <div className="space-y-2 text-sm">
                <p><span className="font-medium text-gray-500">Plan:</span> {membership.membership_plans?.name}</p>
                <p><span className="font-medium text-gray-500">Status:</span>
                  <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${membership.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {membership.status}
                  </span>
                </p>
                <p><span className="font-medium text-gray-500">Start:</span> {membership.start_date}</p>
                <p><span className="font-medium text-gray-500">End:</span> {membership.end_date}</p>
                <p><span className="font-medium text-gray-500">Payment Status:</span> {membership.payments?.[0]?.method || "Unknown"}</p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No active membership.</p>
            )}
          </div>

          {/* Trainer Summary */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Assigned Trainer</h2>
            {trainer ? (
              <p className="text-sm font-medium text-gray-900">{trainer.name}</p>
            ) : (
              <p className="text-gray-500 text-sm">No assigned trainer.</p>
            )}
          </div>

          {/* Assessments */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Latest Assessment</h2>
            {latestAssessment ? (
              <div className="space-y-2 text-sm mb-6">
                <p><span className="font-medium text-gray-500">Date:</span> {new Date(latestAssessment.recorded_at).toLocaleDateString()}</p>
                <p><span className="font-medium text-gray-500">Height:</span> {latestAssessment.height_cm} cm</p>
                <p><span className="font-medium text-gray-500">Weight:</span> {latestAssessment.weight_kg} kg</p>
                {latestAssessment.bmi && <p><span className="font-medium text-gray-500">BMI:</span> {latestAssessment.bmi}</p>}
                {latestAssessment.body_fat_pct && <p><span className="font-medium text-gray-500">Body Fat:</span> {latestAssessment.body_fat_pct}%</p>}
                {latestAssessment.notes && <p><span className="font-medium text-gray-500">Notes:</span> {latestAssessment.notes}</p>}
              </div>
            ) : (
              <p className="text-gray-500 text-sm mb-6">No assessments recorded.</p>
            )}

            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800 list-none">
                + Add Manual Assessment
              </summary>
              <form action={async (formData) => {
                "use server";
                await addAssessment(id, formData);
              }} className="mt-4 space-y-4 text-sm border-t pt-4">
                <div>
                  <label className="block text-gray-700">Height (cm)</label>
                  <input name="height_cm" type="number" step="0.1" required className="mt-1 block w-full border border-gray-300 rounded p-2" />
                </div>
                <div>
                  <label className="block text-gray-700">Weight (kg)</label>
                  <input name="weight_kg" type="number" step="0.1" required className="mt-1 block w-full border border-gray-300 rounded p-2" />
                </div>
                <div>
                  <label className="block text-gray-700">Body Fat (%)</label>
                  <input name="body_fat_pct" type="number" step="0.1" className="mt-1 block w-full border border-gray-300 rounded p-2" />
                </div>
                <div>
                  <label className="block text-gray-700">Notes</label>
                  <textarea name="notes" rows={2} className="mt-1 block w-full border border-gray-300 rounded p-2"></textarea>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
                  Save Assessment
                </button>
              </form>
            </details>
          </div>

        </div>
      </div>
    </div>
  );
}
