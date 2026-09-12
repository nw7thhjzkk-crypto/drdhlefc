import Link from "next/link";
import {
  demoDashboardKPIs,
  demoMember,
  demoMembers,
  demoTrainers,
  demoPayments,
  demoActivities,
  demoProducts,
  demoLeads,
  demoNotifications,
  demoMembershipPlans,
} from "@/lib/demo-data";

export default function DemoPage() {
  return (
    <div className="demo-root">
      <div className="demo-banner">
        <span className="demo-banner-dot" />
        <span className="demo-banner-text">DEMO MODE</span>
        <span className="demo-banner-sep">·</span>
        <span className="demo-banner-hint">
          Synthetic data only — no real production data is shown
        </span>
        <Link href="/login" className="demo-banner-exit">
          Exit Demo
        </Link>
      </div>

      <div className="demo-container">
        <div className="demo-hero">
          <div className="demo-hero-badge">DEMO EXPERIENCE</div>
          <h1 className="demo-hero-title">
            Dr DHL Elite Fitness Club
          </h1>
          <p className="demo-hero-sub">
            Explore the full platform with synthetic demo data.
            No real member or payment data is shown.
          </p>
          <div className="demo-hero-actions">
            <Link href="/demo/owner" className="demo-hero-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              Owner Dashboard
            </Link>
            <Link href="/demo/trainer" className="demo-hero-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Trainer Experience
            </Link>
            <Link href="/demo/member" className="demo-hero-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Member Experience
            </Link>
          </div>
        </div>

        <div className="demo-preview-grid">
          <div className="demo-preview-card">
            <div className="demo-preview-header">
              <h3>Owner ERP</h3>
              <span className="demo-badge demo-badge-owner">Owner</span>
            </div>
            <div className="demo-preview-stats">
              <div className="demo-stat">
                <span className="demo-stat-val">{demoDashboardKPIs.activeMembers}</span>
                <span className="demo-stat-label">Active Members</span>
              </div>
              <div className="demo-stat">
                <span className="demo-stat-val">₹{demoDashboardKPIs.todayCollection.toLocaleString("en-IN")}</span>
                <span className="demo-stat-label">Today&apos;s Collection</span>
              </div>
              <div className="demo-stat">
                <span className="demo-stat-val">{demoDashboardKPIs.activeTrainers}</span>
                <span className="demo-stat-label">Active Trainers</span>
              </div>
              <div className="demo-stat">
                <span className="demo-stat-val">{demoDashboardKPIs.openLeads}</span>
                <span className="demo-stat-label">Open Leads</span>
              </div>
            </div>
            <p className="demo-preview-desc">
              Full ERP: dashboard, members, trainers, memberships, payments, assessments, diet/workout plans, activities, attendance, store/POS, CRM, notifications, analytics, settings, audit.
            </p>
          </div>

          <div className="demo-preview-card">
            <div className="demo-preview-header">
              <h3>Trainer Portal</h3>
              <span className="demo-badge demo-badge-trainer">Trainer</span>
            </div>
            <div className="demo-preview-people">
              {demoMembers.slice(0, 4).map((m) => (
                <div key={m.id} className="demo-person">
                  <span className="demo-person-avatar">{m.name.charAt(0)}</span>
                  <div>
                    <span className="demo-person-name">{m.name}</span>
                    <span className="demo-person-detail">{m.goal}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="demo-preview-desc">
              Assigned members, assessments, diet/workout plans, attendance, activities, notifications.
            </p>
          </div>

          <div className="demo-preview-card">
            <div className="demo-preview-header">
              <h3>Member App</h3>
              <span className="demo-badge demo-badge-member">Member</span>
            </div>
            <div className="demo-preview-member">
              <div className="demo-member-info">
                <span className="demo-person-avatar">{demoMember.name.charAt(0)}</span>
                <div>
                  <span className="demo-person-name">{demoMember.name}</span>
                  <span className="demo-person-detail">{demoMember.memberCode}</span>
                </div>
              </div>
              <div className="demo-member-meta">
                <span>Plan: {demoMember.membershipPlan}</span>
                <span>{demoMember.daysRemaining} days remaining</span>
              </div>
            </div>
            <p className="demo-preview-desc">
              Membership, diet, workout, assessments, attendance, activities, payments, notifications, profile.
            </p>
          </div>
        </div>

        <div className="demo-data-info">
          <h3>Demo Data Included</h3>
          <div className="demo-data-grid">
            <div className="demo-data-item">
              <span className="demo-data-count">{demoMembers.length}</span>
              <span className="demo-data-label">Members</span>
            </div>
            <div className="demo-data-item">
              <span className="demo-data-count">{demoTrainers.length}</span>
              <span className="demo-data-label">Trainers</span>
            </div>
            <div className="demo-data-item">
              <span className="demo-data-count">{demoMembershipPlans.length}</span>
              <span className="demo-data-label">Plans</span>
            </div>
            <div className="demo-data-item">
              <span className="demo-data-count">{demoPayments.length}</span>
              <span className="demo-data-label">Payments</span>
            </div>
            <div className="demo-data-item">
              <span className="demo-data-count">{demoActivities.length}</span>
              <span className="demo-data-label">Activities</span>
            </div>
            <div className="demo-data-item">
              <span className="demo-data-count">{demoProducts.length}</span>
              <span className="demo-data-label">Products</span>
            </div>
            <div className="demo-data-item">
              <span className="demo-data-count">{demoLeads.length}</span>
              <span className="demo-data-label">Leads</span>
            </div>
            <div className="demo-data-item">
              <span className="demo-data-count">{demoNotifications.length}</span>
              <span className="demo-data-label">Notifications</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
