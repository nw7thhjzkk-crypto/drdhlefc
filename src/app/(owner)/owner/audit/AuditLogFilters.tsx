"use client";

import { useState, useMemo } from "react";

type AuditLogRow = {
  id: string;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  created_at: string;
  details?: unknown;
  profiles?: { full_name?: string | null; role?: string | null } | null;
  members?: { name?: string | null } | null;
};

const ACTION_FILTERS = [
  "All Actions",
  "CREATE_MEMBER",
  "UPDATE_MEMBER",
  "ARCHIVE_MEMBER",
  "ADD_ASSESSMENT",
  "ASSIGN_MEMBERSHIP",
  "ASSIGN_TRAINER",
  "UNASSIGN_TRAINER",
  "RECORD_PAYMENT",
  "LOG_ATTENDANCE",
  "CREATE_PRODUCT",
  "UPDATE_PRODUCT",
  "RESTOCK_PRODUCT",
  "STORE_SALE",
  "SEND_NOTIFICATION",
  "BROADCAST_NOTIFICATION",
  "UPDATE_GYM_SETTINGS",
  "BOOK_ACTIVITY",
  "CANCEL_BOOKING",
  "SEED_STARTER_PRODUCTS",
];

export default function AuditLogFilters({ logs }: { logs: AuditLogRow[] }) {
  const [actionFilter, setActionFilter] = useState("All Actions");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter !== "All Actions" && log.action !== actionFilter) return false;

      if (dateFrom) {
        const logDate = new Date(log.created_at).toISOString().split("T")[0];
        if (logDate < dateFrom) return false;
      }
      if (dateTo) {
        const logDate = new Date(log.created_at).toISOString().split("T")[0];
        if (logDate > dateTo) return false;
      }

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const searchable = [
          log.action,
          log.entity_type,
          log.entity_id,
          log.profiles?.full_name,
          log.profiles?.role,
          log.members?.name,
          log.details ? JSON.stringify(log.details) : "",
        ]
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(term)) return false;
      }

      return true;
    });
  }, [logs, actionFilter, dateFrom, dateTo, searchTerm]);

  const exportCSV = () => {
    const headers = ["Timestamp", "Actor", "Role", "Action", "Entity Type", "Entity ID", "Member", "Details"];
    const rows = filteredLogs.map((log) => [
      new Date(log.created_at).toISOString(),
      log.profiles?.full_name || "System",
      log.profiles?.role || "",
      log.action,
      log.entity_type || "",
      log.entity_id || "",
      log.members?.name || "",
      log.details ? JSON.stringify(log.details) : "",
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-zinc-500 mb-1">Search</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search actions, entities, members..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-zinc-200 focus:border-yellow-500"
          />
        </div>
        <div className="min-w-[180px]">
          <label className="block text-xs font-medium text-zinc-500 mb-1">Action Type</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-zinc-200 focus:border-yellow-500"
          >
            {ACTION_FILTERS.map((a) => (
              <option key={a} value={a}>{a === "All Actions" ? "All Actions" : a.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[150px]">
          <label className="block text-xs font-medium text-zinc-500 mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-zinc-200 focus:border-yellow-500"
          />
        </div>
        <div className="min-w-[150px]">
          <label className="block text-xs font-medium text-zinc-500 mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-zinc-200 focus:border-yellow-500"
          />
        </div>
        <button
          onClick={exportCSV}
          className="bg-zinc-800 text-zinc-200 px-4 py-2 rounded text-sm font-medium hover:bg-zinc-700 transition-colors border border-zinc-700"
        >
          Export CSV
        </button>
      </div>

      {/* Results count */}
      <div className="text-xs text-zinc-500">
        Showing {filteredLogs.length} of {logs.length} entries
      </div>

      {/* Table */}
      {filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-10 text-center">
          <h3 className="text-lg font-semibold text-yellow-500">No matching logs</h3>
          <p className="max-w-md text-sm text-zinc-500">
            {logs.length === 0
              ? "Owner and system actions will appear here as they happen."
              : "Try adjusting your filters to see more results."}
          </p>
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 overflow-hidden">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-950">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Actor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Target Entity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-zinc-900 divide-y divide-zinc-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-zinc-200">{log.profiles?.full_name || "System"}</div>
                    <div className="text-xs text-yellow-600 uppercase tracking-wide">{log.profiles?.role}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {log.action?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-zinc-300">{log.entity_type}</div>
                    <div className="text-xs text-zinc-500 font-mono">{log.entity_id ? log.entity_id.substring(0, 8) + "..." : "-"}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400 max-w-xs truncate">
                    {log.details ? JSON.stringify(log.details) : log.members?.name ? `Member: ${log.members.name}` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
