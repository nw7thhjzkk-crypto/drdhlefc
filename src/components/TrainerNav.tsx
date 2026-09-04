"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TRAINER_NAV = [
  { href: "/trainer/dashboard",  label: "Dashboard", icon: "📊" },
  { href: "/trainer/members",    label: "Members",   icon: "👥" },
  { href: "/trainer/attendance", label: "Attendance",icon: "✅" },
  { href: "/trainer/plans",      label: "Plans",     icon: "📋" },
];

export default function TrainerNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="app-bottom-nav" aria-label="Trainer navigation">
      {TRAINER_NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`app-bottom-nav-item${isActive(item.href) ? " active" : ""}`}
          aria-current={isActive(item.href) ? "page" : undefined}
        >
          <span style={{ fontSize: "1.25rem", lineHeight: 1 }} aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
