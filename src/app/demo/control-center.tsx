"use client";

import { useState } from "react";
import { DemoOwnerView } from "./owner-view";
import { DemoTrainerView } from "./trainer-view";
import { DemoMemberView } from "./member-view";

export default function DemoControlCenter() {
  const [activeRole, setActiveRole] = useState<"owner" | "trainer" | "member">("owner");

  return (
    <div className="demo-page">
      <div className="demo-hero">
        <div className="demo-hero-badge">DEMO MODE</div>
        <h1 className="demo-hero-title">Dr DHL Elite Fitness Club</h1>
        <p className="demo-hero-sub">
          Experience the full platform with synthetic demo data.
          No real member or payment data is shown.
        </p>
      </div>

      <div className="demo-switcher">
        <button
          className={`demo-switch-btn ${activeRole === "owner" ? "active" : ""}`}
          onClick={() => setActiveRole("owner")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
          Owner Dashboard
        </button>
        <button
          className={`demo-switch-btn ${activeRole === "trainer" ? "active" : ""}`}
          onClick={() => setActiveRole("trainer")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          Trainer Experience
        </button>
        <button
          className={`demo-switch-btn ${activeRole === "member" ? "active" : ""}`}
          onClick={() => setActiveRole("member")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          Member Experience
        </button>
      </div>

      <div className="demo-view">
        {activeRole === "owner" && <DemoOwnerView />}
        {activeRole === "trainer" && <DemoTrainerView />}
        {activeRole === "member" && <DemoMemberView />}
      </div>
    </div>
  );
}
