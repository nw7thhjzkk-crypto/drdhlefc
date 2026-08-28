import { createClient } from "@/utils/supabase/server";
import { createPlan } from "./actions";

export default async function PlansPage() {
  const supabase = await createClient();

  const { data: plans } = await supabase
    .from("membership_plans")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Membership Plans</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-white p-6 rounded-lg shadow h-fit">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Create New Plan</h2>
          <form action={async (formData) => { "use server"; await createPlan(formData); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Plan Name</label>
              <input name="name" type="text" required className="mt-1 block w-full border border-gray-300 rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Duration (Days)</label>
              <input name="duration_days" type="number" required className="mt-1 block w-full border border-gray-300 rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Price</label>
              <input name="price" type="number" step="0.01" required className="mt-1 block w-full border border-gray-300 rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Plan Type</label>
              <input name="plan_type" type="text" placeholder="e.g., Standard, Premium" required className="mt-1 block w-full border border-gray-300 rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea name="description" rows={3} className="mt-1 block w-full border border-gray-300 rounded p-2"></textarea>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Create Plan
            </button>
          </form>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {plans?.map((plan) => (
                  <tr key={plan.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                      <div className="text-sm text-gray-500">{plan.plan_type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {plan.duration_days} Days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${plan.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${plan.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {plan.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
