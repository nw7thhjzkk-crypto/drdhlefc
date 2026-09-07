import { createClient } from "@/utils/supabase/server";
import PaymentForm from "./PaymentForm";

interface MembershipPlan {
  name: string;
}

interface Membership {
  id: string;
  status: string;
  pending_amount: number;
  membership_plans: MembershipPlan | MembershipPlan[] | null;
}

interface Member {
  id: string;
  name: string;
  memberships: Membership[] | null;
}

export default async function PaymentsPage() {
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from("payments")
    .select(`
      *,
      members (name, member_code),
      memberships (membership_plans (name))
    `)
    .order("paid_at", { ascending: false });

  // Get active members for the payment form
  const { data: membersWithMembershipsRaw } = await supabase
    .from("members")
    .select(`
      id,
      name,
      memberships (id, status, pending_amount, membership_plans(name))
    `)
    .eq("status", "active")
    .eq("memberships.status", "active"); // simplified for now

  const membersWithMemberships = membersWithMembershipsRaw as unknown as Member[];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-100">Payments</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <PaymentForm membersWithMemberships={membersWithMemberships || []} />
        </div>

        <div className="md:col-span-2">
          <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 overflow-hidden">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-950">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Method</th>
                </tr>
              </thead>
              <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                {payments?.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                      {new Date(payment.paid_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-zinc-200">{(payment.members as Member)?.name}</div>
                      <div className="text-sm text-zinc-500">
                        {Array.isArray((payment.memberships as Membership)?.membership_plans)
                          ? ((payment.memberships as Membership)?.membership_plans as MembershipPlan[])[0]?.name
                          : ((payment.memberships as Membership)?.membership_plans as MembershipPlan)?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-400">
                      ${payment.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                      {payment.method}
                      {payment.reference && <span className="block text-xs text-zinc-500 mt-1">Ref: {payment.reference}</span>}
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
