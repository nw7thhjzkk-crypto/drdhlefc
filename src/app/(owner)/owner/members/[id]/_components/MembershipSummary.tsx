import { assignMembership } from "../../actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MembershipSummary({ membership, id, plans }: { membership: any; id: string; plans: any[] }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2">Membership</h2>
      {membership ? (
        <div className="space-y-2 text-sm mb-4">
          <p>
            <span className="font-medium text-gray-500">Plan:</span> {membership.membership_plans?.name}
          </p>
          <p>
            <span className="font-medium text-gray-500">Status:</span>
            <span
              className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${membership.status === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
            >
              {membership.status}
            </span>
          </p>
          <p>
            <span className="font-medium text-gray-500">Start:</span> {membership.start_date}
          </p>
          <p>
            <span className="font-medium text-gray-500">End:</span> {membership.end_date}
          </p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p>
              <span className="font-medium text-gray-500">Total:</span> ${membership.total_amount}
            </p>
            <p>
              <span className="font-medium text-gray-500">Paid:</span> ${membership.paid_amount}
            </p>
            <p>
              <span className="font-medium text-gray-500">Pending:</span> ${membership.pending_amount}
            </p>
          </div>
          {membership.payments && membership.payments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="font-medium text-gray-700 mb-2">Payment History:</p>
              <ul className="space-y-1">
                {membership.payments.map((p: any /* eslint-disable-line @typescript-eslint/no-explicit-any */, i: number) => (
                  <li key={i} className="text-xs text-gray-600">
                    {new Date(p.paid_at).toLocaleDateString()} - ${p.amount} ({p.method})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-4">
          <p className="text-gray-500 text-sm">No active membership.</p>
        </div>
      )}

      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800 list-none">
          + Assign New Membership
        </summary>
        <form
          action={async (formData) => {
            "use server";
            await assignMembership(id, formData);
          }}
          className="mt-4 space-y-4 text-sm border-t pt-4"
        >
          <div>
            <label className="block text-gray-700">Plan</label>
            <select name="plan_id" required className="mt-1 block w-full border border-gray-300 rounded p-2">
              <option value="">Select Plan...</option>
              {plans?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - ${p.price}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700">Start Date</label>
            <input
              name="start_date"
              type="date"
              required
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>
          <div>
            <label className="block text-gray-700">Total Amount</label>
            <input
              name="total_amount"
              type="number"
              step="0.01"
              required
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>
          <div>
            <label className="block text-gray-700">Paid Amount (Initial)</label>
            <input
              name="paid_amount"
              type="number"
              step="0.01"
              defaultValue="0"
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
            Assign Plan
          </button>
        </form>
      </details>
    </div>
  );
}
