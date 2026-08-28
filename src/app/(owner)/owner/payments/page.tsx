import { createClient } from "@/utils/supabase/server";
import { recordPayment } from "./actions";
import { QueryData } from "@supabase/supabase-js";

export default async function PaymentsPage() {
  const supabase = await createClient();

  const paymentsQuery = supabase
    .from("payments")
    .select(`
      *,
      members (name, member_code),
      memberships (membership_plans (name))
    `)
    .order("paid_at", { ascending: false });
  type Payments = QueryData<typeof paymentsQuery>;
  const { data: payments } = await paymentsQuery;

  // Get active members for the payment form
  const membersWithMembershipsQuery = supabase
    .from("members")
    .select(`
      id,
      name,
      memberships (id, status, pending_amount, membership_plans(name))
    `)
    .eq("status", "active")
    .eq("memberships.status", "active"); // simplified for now
  type MembersWithMemberships = QueryData<typeof membersWithMembershipsQuery>;
  const { data: membersWithMemberships } = await membersWithMembershipsQuery;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-white p-6 rounded-lg shadow h-fit">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Record Payment</h2>
          <form action={async (formData) => { "use server"; await recordPayment(formData); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Member</label>
              <select name="member_id" required className="mt-1 block w-full border border-gray-300 rounded p-2">
                <option value="">Select Member...</option>
                {membersWithMemberships?.filter((m) => m.memberships && m.memberships.length > 0).map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            {/* Note: In a real app, membership_id would dynamically filter based on the selected member.
                For this scaffolding, we assume the server action handles the mapping or the user selects it.
                Here we'll fetch all active memberships for simplicity. */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Membership</label>
              <select name="membership_id" required className="mt-1 block w-full border border-gray-300 rounded p-2">
                <option value="">Select Membership...</option>
                {membersWithMemberships?.map((m: MembersWithMemberships[0]) =>
                  m.memberships?.map((ms: NonNullable<MembersWithMemberships[0]["memberships"]>[0]) => (
                    <option key={ms.id} value={ms.id}>{m.name} - {(Array.isArray(ms.membership_plans) ? ms.membership_plans[0] : ms.membership_plans)?.name} (${ms.pending_amount} pending)</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input name="amount" type="number" step="0.01" required className="mt-1 block w-full border border-gray-300 rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Method</label>
              <select name="method" required className="mt-1 block w-full border border-gray-300 rounded p-2">
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Reference / Txn ID</label>
              <input name="reference" type="text" className="mt-1 block w-full border border-gray-300 rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea name="notes" rows={2} className="mt-1 block w-full border border-gray-300 rounded p-2"></textarea>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Record Payment
            </button>
          </form>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments?.map((payment: Payments[0]) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.paid_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.members?.name}</div>
                      <div className="text-sm text-gray-500">{(() => {
                        const ms = Array.isArray(payment.memberships) ? payment.memberships[0] : payment.memberships;
                        const plan = Array.isArray(ms?.membership_plans) ? ms.membership_plans[0] : ms?.membership_plans;
                        return plan?.name;
                      })()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      ${payment.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.method}
                      {payment.reference && <span className="block text-xs text-gray-400">Ref: {payment.reference}</span>}
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
