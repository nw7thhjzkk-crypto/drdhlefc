import Image from "next/image";
import { updateMember } from "../../actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MemberDetailsForm({ member, id }: { member: any; id: string }) {
  return (
    <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-6 border-b pb-2">Details</h2>

      <form
        action={async (formData) => {
          "use server";
          await updateMember(id, formData);
        }}
        className="space-y-6"
      >
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
            <input
              name="name"
              type="text"
              defaultValue={member.name}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              name="email"
              type="email"
              defaultValue={member.email}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              name="phone"
              type="text"
              defaultValue={member.phone || ""}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
            <input
              name="dob"
              type="date"
              defaultValue={member.dob || ""}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Gender</label>
            <select
              name="gender"
              defaultValue={member.gender || ""}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            >
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <textarea
            name="address"
            rows={2}
            defaultValue={member.address || ""}
            className="mt-1 block w-full border border-gray-300 rounded p-2"
          ></textarea>
        </div>

        <h3 className="text-lg font-medium text-gray-900 border-b pb-2 pt-4">Emergency Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              name="emergency_contact_name"
              type="text"
              defaultValue={member.emergency_contact_name || ""}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              name="emergency_contact_phone"
              type="text"
              defaultValue={member.emergency_contact_phone || ""}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>
        </div>

        <h3 className="text-lg font-medium text-gray-900 border-b pb-2 pt-4">Fitness Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Primary Goal</label>
            <input
              name="primary_goal"
              type="text"
              defaultValue={member.primary_goal || ""}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Secondary Goal</label>
            <input
              name="secondary_goal"
              type="text"
              defaultValue={member.secondary_goal || ""}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fitness Level</label>
            <select
              name="fitness_level"
              defaultValue={member.fitness_level || ""}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            >
              <option value="">Select...</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Diet Preference</label>
            <input
              name="diet_preference"
              type="text"
              defaultValue={member.diet_preference || ""}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Training Experience / Injuries</label>
            <textarea
              name="training_experience"
              rows={2}
              defaultValue={member.training_experience || ""}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            ></textarea>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Internal Notes</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={member.notes || ""}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            ></textarea>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
