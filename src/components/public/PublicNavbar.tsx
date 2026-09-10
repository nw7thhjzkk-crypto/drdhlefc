"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark } from "./BrandMark";
import { site } from "@/lib/site";

const LINKS = [
  { href: "/#club", label: "The Club" },
  { href: "/#training", label: "Training" },
  { href: "/#memberships", label: "Memberships" },
  { href: "/#visit", label: "Visit" },
  { href: "/#access", label: "Early Access" },
];

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape for keyboard users.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={`pub-nav${scrolled ? " is-scrolled" : ""}`}>
      <div className="pub-nav-inner">
        <Link href="/" className="pub-nav-brand" aria-label={site.name}>
          <BrandMark size={36} priority />
          <span className="pub-nav-wordmark">
            <span className="pub-nav-name">Dr DHL</span>
            <span className="pub-nav-sub">Elite Fitness Club</span>
          </span>
        </Link>

        <nav className="pub-nav-links" aria-label="Primary">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="pub-nav-actions">
          <Link href="/login" className="pub-btn pub-btn-ghost pub-btn-sm">
            Login
          </Link>
          <Link
            href="/#access"
            className="pub-btn pub-btn-gold pub-btn-sm pub-nav-cta"
          >
            Get Early Access
          </Link>
          <button
            type="button"
            className="pub-nav-toggle"
            aria-expanded={open}
            aria-controls="pub-mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg
              viewBox="0 0 20 20"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {open ? (
                <>
                  <path d="M4 4l12 12M16 4L4 16" />
                </>
              ) : (
                <>
                  <path d="M3 6h14M3 10h14M3 14h14" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <div id="pub-mobile-nav" className="pub-nav-mobile">
          <nav aria-label="Mobile">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="pub-nav-mobile-actions">
            <Link href="/login" onClick={() => setOpen(false)}>
              Login
            </Link>
            <Link
              href="/#access"
              className="pub-btn pub-btn-gold"
              onClick={() => setOpen(false)}
            >
              Get Early Access
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
