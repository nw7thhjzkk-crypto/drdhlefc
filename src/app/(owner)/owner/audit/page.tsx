import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AuditLogFilters from "./AuditLogFilters";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Audit Logs" };

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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
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

  const { data: logs } = await supabase
    .from("audit_logs")
    .select(`*, profiles(full_name, role), members(name)`)
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-yellow-500">System Audit Logs</h1>
      </div>

      <AuditLogFilters logs={(logs as AuditLogRow[]) || []} />
    </div>
  );
}
