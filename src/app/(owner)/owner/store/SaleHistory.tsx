"use client";

import { useState } from "react";
import { formatINR } from "@/lib/currency";

type Sale = {
  id: string;
  created_at: string;
  total_amount: number;
  payment_method: string | null;
  members?: { name?: string | null } | null;
};

const PAGE_SIZE = 10;

export default function SaleHistory({ sales }: { sales: Sale[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(sales.length / PAGE_SIZE);
  const startIdx = (page - 1) * PAGE_SIZE;
  const pageSales = sales.slice(startIdx, startIdx + PAGE_SIZE);

  return (
    <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-zinc-100">Sale History</h2>
        <span className="text-xs text-zinc-500">{sales.length} total sales</span>
      </div>
      {sales.length === 0 ? (
        <div className="m-6 flex flex-col items-center justify-center space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-10 text-center">
          <h3 className="text-lg font-semibold text-yellow-500">No sales yet</h3>
          <p className="max-w-md text-sm text-zinc-500">
            Completed POS checkouts will show up here. Add inventory and ring up
            a sale to get started.
          </p>
        </div>
      ) : (
        <>
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
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-zinc-900 divide-y divide-zinc-800">
              {pageSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                    {new Date(sale.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-200">
                    {sale.members?.name || "Walk-in"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 capitalize">
                    {sale.payment_method || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-400">
                    {formatINR(sale.total_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-zinc-800 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-xs text-zinc-400 hover:text-yellow-500 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <span className="text-xs text-zinc-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-xs text-zinc-400 hover:text-yellow-500 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
