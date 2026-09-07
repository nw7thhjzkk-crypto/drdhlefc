"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Production-only SW registration + light install hint for member routes.
 * Never caches API data — registration only points at /sw.js (shell cache).
 */
export default function PwaClient() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Silent — installability still works via manifest when SW fails.
    });
  }, []);

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (!deferred || dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Install app"
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: 76,
        zIndex: 40,
        display: "flex",
        gap: 8,
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 12px",
        borderRadius: 12,
        background: "var(--color-surface, #1a1a1a)",
        border: "1px solid var(--color-border, #333)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
      }}
    >
      <span style={{ fontSize: "0.875rem", color: "var(--color-silver, #ccc)" }}>
        Install DR DHL Fitness for quicker access
      </span>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{
            fontSize: "0.75rem",
            padding: "8px 10px",
            borderRadius: 8,
            background: "transparent",
            color: "var(--color-silver-dark, #888)",
            border: "none",
            minHeight: 44,
          }}
        >
          Not now
        </button>
        <button
          type="button"
          onClick={async () => {
            await deferred.prompt();
            setDeferred(null);
          }}
          style={{
            fontSize: "0.75rem",
            padding: "8px 12px",
            borderRadius: 8,
            background: "var(--color-gold, #D4AF37)",
            color: "#0A0A0A",
            border: "none",
            fontWeight: 600,
            minHeight: 44,
          }}
        >
          Install
        </button>
      </div>
    </div>
  );
}
