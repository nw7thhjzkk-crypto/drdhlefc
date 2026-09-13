"use client";

import { Suspense, useState } from "react";
import { createMember } from "../actions";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useFormMutation } from "@/hooks/useFormMutation";

function NewMemberForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const leadId = searchParams.get("lead_id") ?? "";
  const defaultName = searchParams.get("name") ?? "";
  const defaultPhone = searchParams.get("phone") ?? "";
  const defaultEmail = searchParams.get("email") ?? "";
  const convertingFromLead = Boolean(leadId || defaultName || defaultPhone || defaultEmail);

  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
    memberCode: string;
    memberId: string;
  } | null>(null);

  const { handleSubmit, isPending: loading, error } = useFormMutation(
    createMember,
    (res: { memberId?: string; member_code?: string; credentials?: { email: string; password: string } }) => {
      if (res.memberId && res.credentials && res.member_code) {
        setCredentials({
          email: res.credentials.email,
          password: res.credentials.password,
          memberCode: res.member_code,
          memberId: res.memberId,
        });
      } else if (res.memberId) {
        router.push(`/owner/members/${res.memberId}`);
      }
    }
  );

  if (credentials) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="card" style={{ borderColor: "#22C55E", borderWidth: "1px", borderStyle: "solid" }}>
          <div className="card-header" style={{ backgroundColor: "#F0FDF4", borderBottom: "1px solid #BBF7D0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.25rem" }}>✅</span>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#065F46", margin: 0 }}>
                Member Created Successfully
              </h2>
            </div>
          </div>
          <div className="card-body">
            <p style={{ fontSize: "0.875rem", color: "#374151", marginBottom: "1.5rem" }}>
              The lead has been converted to a member. Share these login credentials with the new member:
            </p>

            <div style={{
              backgroundColor: "#F9FAFB",
              border: "1px solid #E5E7EB",
              borderRadius: "var(--radius-md)",
              padding: "1.25rem",
              marginBottom: "1.5rem",
            }}>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                    Member Code
                  </div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", fontFamily: "var(--font-mono)" }}>
                    {credentials.memberCode}
                  </div>
                </div>
                <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "0.75rem" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                    Login Email
                  </div>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#111827" }}>
                    {credentials.email}
                  </div>
                </div>
                <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "0.75rem" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                    Temporary Password
                  </div>
                  <div style={{
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    color: "#111827",
                    fontFamily: "var(--font-mono)",
                    backgroundColor: "#FEF3C7",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid #FDE68A",
                    wordBreak: "break-all",
                  }}>
                    {credentials.password}
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: "#FEF3C7",
              border: "1px solid #FDE68A",
              borderRadius: "var(--radius-md)",
              padding: "0.75rem 1rem",
              marginBottom: "1.5rem",
              fontSize: "0.8125rem",
              color: "#92400E",
            }}>
              ⚠️ Save this password now. It will not be shown again. The member should change it on first login.
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <Link href="/owner/leads" className="btn btn-ghost">
                Back to Leads
              </Link>
              <Link href={`/owner/members/${credentials.memberId}`} className="btn btn-primary">
                View Member Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Add New Member</h1>
        <Link href="/owner/members" className="btn btn-ghost btn-sm">Back to Members</Link>
      </div>

      {convertingFromLead && (
        <div className="alert alert-info" style={{ marginBottom: "1.5rem" }}>
          <span>ℹ️</span>
          <span>
            Converting CRM lead{leadId ? ` (${leadId})` : ""} — name, phone, and email are prefilled. Complete the form and create the member.
            {" "}
            <Link href="/owner/leads" style={{ fontWeight: 700, textDecoration: "underline" }}>Back to leads</Link>
          </span>
        </div>
      )}

      {error && <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>{error}</div>}

      <form action={handleSubmit} className="card">
        <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input name="name" type="text" required defaultValue={defaultName} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input name="email" type="email" required defaultValue={defaultEmail} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input name="phone" type="text" defaultValue={defaultPhone} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input name="dob" type="date" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select name="gender" className="form-input">
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Photo</label>
              <input name="photo" type="file" accept="image/*" className="form-input" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea name="address" rows={2} className="form-input"></textarea>
          </div>

          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827", borderBottom: "1px solid #E5E7EB", paddingBottom: "0.5rem", marginBottom: "1rem" }}>Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input name="emergency_contact_name" type="text" className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input name="emergency_contact_phone" type="text" className="form-input" />
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827", borderBottom: "1px solid #E5E7EB", paddingBottom: "0.5rem", marginBottom: "1rem" }}>Fitness Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Primary Goal</label>
                <input name="primary_goal" type="text" placeholder="e.g. Weight Loss" className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Secondary Goal</label>
                <input name="secondary_goal" type="text" className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Fitness Level</label>
                <select name="fitness_level" className="form-input">
                  <option value="">Select...</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Diet Preference</label>
                <input name="diet_preference" type="text" className="form-input" />
              </div>
              <div className="md:col-span-2 form-group">
                <label className="form-label">Training Experience / Injuries</label>
                <textarea name="training_experience" rows={2} className="form-input"></textarea>
              </div>
              <div className="md:col-span-2 form-group">
                <label className="form-label">Internal Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={leadId ? `Converted from CRM lead ${leadId}` : ""}
                  className="form-input"
                ></textarea>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? "Creating..." : "Create Member"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function NewMemberPage() {
  return (
    <Suspense fallback={<div className="p-8 max-w-3xl mx-auto" style={{ color: "#9CA3AF" }}>Loading form…</div>}>
      <NewMemberForm />
    </Suspense>
  );
}
