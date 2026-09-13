"use client";

import { useState, useTransition } from "react";
import { logSelfAttendance } from "../attendance/actions";

export default function CheckInButton({ hasCheckedInToday }: { hasCheckedInToday: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (hasCheckedInToday) {
    return (
      <button
        disabled
        style={{
          width: "100%",
          padding: "0.75rem",
          borderRadius: "var(--radius-md)",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.05)",
          color: "var(--color-silver-dark)",
          fontWeight: 600,
          cursor: "not-allowed",
          marginTop: "1rem",
        }}
      >
        Checked in today
      </button>
    );
  }

  return (
    <>
      {error && (
        <div role="alert" style={{ marginTop: "0.75rem", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(239,68,68,0.5)", background: "rgba(239,68,68,0.1)", color: "#FCA5A5", fontSize: "0.8125rem" }}>
          {error}
        </div>
      )}
      <button
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await logSelfAttendance();
            } catch (e: unknown) {
              setError(e instanceof Error ? e.message : "Check-in failed");
            }
          });
        }}
        style={{
          width: "100%",
          padding: "0.75rem",
          borderRadius: "var(--radius-md)",
          border: "none",
          background: "var(--color-gold)",
          color: "#000",
          fontWeight: 700,
          cursor: isPending ? "not-allowed" : "pointer",
          opacity: isPending ? 0.7 : 1,
          marginTop: "1rem",
          boxShadow: "0 4px 12px rgba(201,168,76,0.3)",
        }}
      >
        {isPending ? "Checking in..." : "Check in today"}
      </button>
    </>
  );
}
