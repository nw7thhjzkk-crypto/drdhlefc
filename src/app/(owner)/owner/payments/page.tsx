import { createClient } from "@/utils/supabase/server";
import { formatINR } from "@/lib/currency";
import { redirect } from "next/navigation";
import { recordPayment } from "./actions";
import Link from "next/link";

interface MembershipPlan {
  name: string;
}

interface Membership {
  id: string;
  pending_amount: number;
  membership_plans: MembershipPlan | MembershipPlan[] | null;
}

interface Member {
  name: string;
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; success?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") {
    redirect("/login");
  }

  const { data: payments } = await supabase
    .from("payments")
    .select(`
      *,
      members (name, member_code),
      memberships (membership_plans (name))
    `)
    .order("paid_at", { ascending: false });

  const { data: membersWithMemberships } = await supabase
    .from("members")
    .select(`
      id,
      name,
      memberships (id, status, pending_amount, membership_plans(name))
    `)
    .eq("status", "active");

  const paymentRows = payments ?? [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-yellow-500">Payments</h1>
      </div>

      {params.error && (
        <div
          className="rounded-lg border border-red-800 bg-red-950/60 px-4 py-3 text-sm text-red-300"
          role="alert"
        >
          {params.error}
        </div>
      )}
      {params.success && (
        <div className="rounded-lg border border-green-800 bg-green-950/60 px-4 py-3 text-sm text-green-300">
          Payment recorded.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-zinc-900 p-6 rounded-lg shadow-xl border border-zinc-800 h-fit">
          <h2 className="text-lg font-semibold text-zinc-100 mb-4 border-b border-zinc-800 pb-2">
            Record Payment
          </h2>
          <form
            action={async (formData) => {
              "use server";
              const result = await recordPayment(formData);
              if (result?.error) {
                redirect(
                  `/owner/payments?error=${encodeURIComponent(result.error)}`
                );
              }
              redirect("/owner/payments?success=1");
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-zinc-400">
                Membership
              </label>
              {(!membersWithMemberships ||
                membersWithMemberships.every(
                  (m) => !m.memberships || m.memberships.length === 0
                )) ? (
                <div className="mt-1 text-sm text-zinc-500 bg-zinc-950 border border-zinc-800 rounded p-2">
                  No active memberships available. Please assign a membership
                  plan to a member first.
                </div>
              ) : (
                <select
                  name="membership_id"
                  required
                  className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                >
                  <option value="">Select Membership...</option>
                  {membersWithMemberships?.map((m) =>
                    m.memberships?.map((ms: Membership) => {
                      const planName = Array.isArray(ms.membership_plans)
                        ? ms.membership_plans[0]?.name
                        : ms.membership_plans?.name;
                      return (
                        <option key={ms.id} value={ms.id}>
                          {m.name} - {planName} ({formatINR(ms.pending_amount)}{" "}
                          pending)
                        </option>
                      );
                    })
                  )}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400">
                Amount (₹)
              </label>
              <input
                name="amount"
                type="number"
                step="0.01"
                required
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">
                Method
              </label>
              <select
                name="method"
                required
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">
                Reference / Txn ID
              </label>
              <input
                name="reference"
                type="text"
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400">
                Notes
              </label>
              <textarea
                name="notes"
                rows={2}
                className="mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-yellow-600 text-zinc-950 font-bold px-4 py-2 rounded hover:bg-yellow-500 transition-colors"
            >
              Record Payment
            </button>
          </form>
        </div>

        <div className="md:col-span-2">
          <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-100">Payment History</h2>
            </div>
            {paymentRows.length === 0 ? (
              <div className="m-6 flex flex-col items-center justify-center space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-10 text-center">
                <h3 className="text-lg font-semibold text-yellow-500">No payments yet</h3>
                <p className="max-w-md text-sm text-zinc-500">
                  Payment history is empty. Use Record Payment when a member has an active membership, or open plans and members to get started.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/owner/plans"
                    className="inline-flex items-center justify-center bg-zinc-800 text-yellow-500 font-bold px-4 py-2 rounded hover:bg-zinc-700 transition-colors"
                  >
                    Manage Plans
                  </Link>
                  <Link
                    href="/owner/members"
                    className="inline-flex items-center justify-center bg-yellow-600 text-zinc-950 font-bold px-4 py-2 rounded hover:bg-yellow-500 transition-colors"
                  >
                    View Members
                  </Link>
                </div>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-zinc-800">
                <thead className="bg-zinc-950">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      Method
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                  {paymentRows.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                        {new Date(payment.paid_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-zinc-200">
                          {(payment.members as Member)?.name}
                        </div>
                        <div className="text-sm text-zinc-500">
                          {Array.isArray(
                            (payment.memberships as Membership)?.membership_plans
                          )
                            ? (
                                (payment.memberships as Membership)
                                  ?.membership_plans as MembershipPlan[]
                              )[0]?.name
                            : (
                                (payment.memberships as Membership)
                                  ?.membership_plans as MembershipPlan
                              )?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-400">
                        {formatINR(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                        {payment.method}
                        {payment.reference && (
                          <span className="block text-xs text-zinc-500">
                            Ref: {payment.reference}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
