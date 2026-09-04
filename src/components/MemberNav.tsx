"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MEMBER_NAV = [
  { href: "/member/home",       label: "Home",       icon: "🏠" },
  { href: "/member/diet",       label: "Diet",       icon: "🥗" },
  { href: "/member/workout",    label: "Workout",    icon: "💪" },
  { href: "/member/plans",      label: "Membership", icon: "🎫" },
];

export default function MemberNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="app-bottom-nav" aria-label="Member navigation">
      {MEMBER_NAV.map((item) => (
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
