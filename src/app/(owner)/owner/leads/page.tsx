import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { addLead, updateLead, seedStarterLeads } from "./actions";
import LeadStageSelect from "./LeadStageSelect";

function isConvertibleStage(stage: string | null | undefined): boolean {
  const normalized = (stage ?? "").trim().toLowerCase();
  return normalized === "won" || normalized === "converted";
}

function buildConvertMemberHref(lead: {
  id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
}): string {
  const params = new URLSearchParams();
  params.set("lead_id", lead.id);
  if (lead.name) params.set("name", lead.name);
  if (lead.phone) params.set("phone", lead.phone);
  if (lead.email) params.set("email", lead.email);
  return `/owner/members/new?${params.toString()}`;
}

const STAGE_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "trial", label: "Trial" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
] as const;

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function CRMPage() {
  const supabase = await createClient();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { data: leads },
    { data: trainers },
    { count: totalLeads },
    { count: newThisWeek },
    { count: convertedThisMonth },
    { count: totalConverted },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("*, trainers(name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("trainers")
      .select("id, name")
      .order("name", { ascending: true }),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .in("stage", ["won", "converted"])
      .gte("updated_at", firstDayOfMonth),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .in("stage", ["won", "converted"]),
  ]);

  const total = totalLeads ?? 0;
  const converted = totalConverted ?? 0;
  const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Leads & CRM</h1>
          <p className="page-subtitle">Track and convert prospects into members</p>
        </div>
      </div>

      {/* CRM Stats Summary */}
      <div className="dashboard-kpi-grid">
        <div className="stat-card" style={{ borderLeft: "4px solid #3B82F6" }}>
          <div className="stat-card-label">Total Leads</div>
          <div className="stat-card-value">{total}</div>
          <div className="stat-card-sub">in pipeline</div>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #22C55E" }}>
          <div className="stat-card-label">New This Week</div>
          <div className="stat-card-value">{newThisWeek ?? 0}</div>
          <div className="stat-card-sub">last 7 days</div>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #EAB308" }}>
          <div className="stat-card-label">Converted This Month</div>
          <div className="stat-card-value">{convertedThisMonth ?? 0}</div>
          <div className="stat-card-sub">{now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #8B5CF6" }}>
          <div className="stat-card-label">Conversion Rate</div>
          <div className="stat-card-value">{conversionRate}%</div>
          <div className="stat-card-sub">{converted} of {total} leads</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Add Lead Form */}
        <div className="lg:col-span-1 card h-fit">
            <div className="card-header">
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827" }}>New Lead</h2>
            </div>
            <div className="card-body">
            <form action={addLead} className="space-y-4">
                <div className="form-group">
                    <label className="form-label">Name</label>
                    <input name="name" required className="form-input" />
                </div>
                <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input name="phone" required className="form-input" />
                </div>
                <div className="form-group">
                    <label className="form-label">Email</label>
                    <input name="email" type="email" className="form-input" />
                </div>
                <div className="form-group">
                    <label className="form-label">Source</label>
                    <select name="source" required className="form-input">
                        <option value="Walk-in">Walk-in</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Website">Website</option>
                        <option value="Referral">Referral</option>
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Stage</label>
                    <select name="stage" required className="form-input">
                        {STAGE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                <button type="submit" className="btn btn-primary btn-full">
                    Add Lead
                </button>
            </form>
            </div>
        </div>

        <div className="lg:col-span-3 card overflow-hidden">
            <div className="table-wrapper" style={{ border: "none", borderRadius: 0 }}>
            <table className="data-table">
            <thead>
                <tr>
                <th>Name / Contact</th>
                <th>Enquiry notes</th>
                <th>Source</th>
                <th>Stage</th>
                <th>Assigned To</th>
                <th>Follow-Up</th>
                <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {leads?.map((lead) => (
                <tr key={lead.id}>
                    <td>
                    <div style={{ fontWeight: 600, color: "#111827" }}>{lead.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>{lead.phone} | {lead.email}</div>
                    <form id={`form-${lead.id}`} action={updateLead} className="hidden">
                        <input type="hidden" name="id" value={lead.id} />
                    </form>
                    </td>
                    <td>
                    {lead.notes ? (
                        <p
                          style={{ fontSize: "0.75rem", color: "#6B7280", maxWidth: "280px" }}
                          className="truncate-2"
                          title={lead.notes}
                        >
                          {lead.notes}
                        </p>
                    ) : (
                        <span style={{ fontSize: "0.75rem", color: "#D1D5DB" }}>—</span>
                    )}
                    </td>
                    <td style={{ fontSize: "0.875rem", color: "#6B7280", textTransform: "capitalize" }}>
                    {lead.source}
                    </td>
                    <td>
                    <LeadStageSelect leadId={lead.id} defaultStage={lead.stage} />
                    </td>
                    <td>
                    <select
                        name="assigned_trainer"
                        form={`form-${lead.id}`}
                        defaultValue={lead.assigned_trainer || ""}
                        className="form-input"
                        style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", maxWidth: "140px" }}
                    >
                        <option value="">Unassigned</option>
                        {trainers?.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                    {(!trainers || trainers.length === 0) && (
                        <div style={{ fontSize: "0.625rem", color: "#92400E", marginTop: "0.25rem", maxWidth: "140px" }}>
                            No trainers available.
                        </div>
                    )}
                    </td>
                    <td>
                    <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                        {formatDate(lead.follow_up_at)}
                    </div>
                    <input
                        type="date"
                        name="follow_up_at"
                        form={`form-${lead.id}`}
                        defaultValue={lead.follow_up_at ? new Date(lead.follow_up_at).toISOString().split('T')[0] : ""}
                        className="form-input"
                        style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", maxWidth: "140px", marginTop: "0.25rem" }}
                    />
                    </td>
                    <td>
                    <div className="flex flex-col gap-1 items-start">
                      <button type="submit" form={`form-${lead.id}`} className="btn btn-ghost btn-sm">
                          Save
                      </button>
                      {isConvertibleStage(lead.stage) && (
                        <Link
                          href={buildConvertMemberHref(lead)}
                          className="text-yellow-600 hover:text-yellow-500 hover:underline"
                          style={{ fontSize: "0.75rem", fontWeight: 700 }}
                        >
                          Convert to member
                        </Link>
                      )}
                    </div>
                    </td>
                </tr>
                ))}
                {(!leads || leads.length === 0) && (
                <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <div className="empty-state-icon">📞</div>
                        <div className="empty-state-title">No leads yet</div>
                        <div className="empty-state-body">
                          Add your first lead to start tracking prospects.
                          You can add walk-ins, referrals, or website enquiries above.
                        </div>
                        <form action={seedStarterLeads} style={{ marginTop: "1rem" }}>
                          <button
                            type="submit"
                            className="btn btn-secondary btn-sm"
                          >
                            Generate Sample Leads
                          </button>
                        </form>
                      </div>
                    </td>
                </tr>
                )}
            </tbody>
            </table>
            </div>
        </div>
      </div>
    </div>
  );
}
