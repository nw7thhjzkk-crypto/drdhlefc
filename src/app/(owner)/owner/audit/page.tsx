import { createClient } from "@/utils/supabase/server";

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

export default async function AuditLogPage() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("audit_logs")
    .select(`*, profiles(full_name, role), members(name)`)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-yellow-500">System Audit Logs</h1>
      </div>

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
            {(logs as AuditLogRow[] | null)?.map((log) => (
              <tr key={log.id} className="hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-zinc-200">{log.profiles?.full_name || 'System'}</div>
                  <div className="text-xs text-yellow-600 uppercase tracking-wide">{log.profiles?.role}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-zinc-300">{log.entity_type}</div>
                  <div className="text-xs text-zinc-500 font-mono">{log.entity_id ? log.entity_id.substring(0,8) + '...' : '-'}</div>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-400 max-w-xs truncate">
                  {log.details ? JSON.stringify(log.details) : (log.members?.name ? `Member: ${log.members.name}` : '-')}
                </td>
              </tr>
            ))}
            {(!logs || logs.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">No audit logs available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
