"use client";

import { useTransition } from "react";
import { logSelfAttendance } from "../attendance/actions";

export default function CheckInButton({ hasCheckedInToday }: { hasCheckedInToday: boolean }) {
  const [isPending, startTransition] = useTransition();

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
    <button
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          try {
            await logSelfAttendance();
          } catch (e: unknown) {
            alert((e as Error).message);
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
  );
}
