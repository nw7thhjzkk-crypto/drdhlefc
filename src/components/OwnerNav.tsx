"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { href: "/owner/dashboard", label: "Dashboard", icon: "📊" },
    ],
  },
  {
    label: "Members",
    items: [
      { href: "/owner/members",   label: "Members",          icon: "👥" },
      { href: "/owner/trainers",  label: "Trainers",         icon: "🏋️" },
      { href: "/owner/plans",     label: "Membership Plans", icon: "📋" },
      { href: "/owner/payments",  label: "Payments",         icon: "💳" },
    ],
  },
  {
    label: "Training",
    items: [
      { href: "/owner/activities",    label: "Activities",    icon: "🗓️" },
      { href: "/owner/attendance",    label: "Attendance",    icon: "✅" },
      { href: "/owner/diet-plans",    label: "Diet Plans",    icon: "🥗" },
      { href: "/owner/workout-plans", label: "Workout Plans", icon: "💪" },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/owner/store", label: "Store / POS",  icon: "🛒" },
      { href: "/owner/leads", label: "CRM / Leads",  icon: "📞" },
      { href: "/owner/audit", label: "Audit Logs",   icon: "🔍" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/owner/settings", label: "Settings", icon: "⚙️" },
    ],
  },
];

export default function OwnerNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/owner/dashboard" && pathname.startsWith(href));

  return (
    <nav className="erp-sidebar" aria-label="Owner navigation">
      {/* Logo */}
      <div className="erp-sidebar-logo">
        <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>🏆</div>
        <div className="erp-sidebar-logo-text">DR DHL</div>
        <div style={{ fontSize: "0.65rem", color: "var(--color-silver-dark)", letterSpacing: "0.06em" }}>
          ELITE FITNESS CLUB
        </div>
      </div>

      {/* Nav sections */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: "1rem" }}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="erp-nav-section">
            <div className="erp-nav-section-label">{section.label}</div>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`erp-nav-item${isActive(item.href) ? " active" : ""}`}
              >
                <span style={{ fontSize: "1rem", width: "1.125rem", textAlign: "center" }} aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom: logout */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "0.75rem 0" }}>
        <form action="/auth/logout" method="post">
          <button
            type="submit"
            className="erp-nav-item"
            style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer" }}
          >
            <span style={{ fontSize: "1rem", width: "1.125rem", textAlign: "center" }} aria-hidden="true">🚪</span>
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </nav>
  );
}
