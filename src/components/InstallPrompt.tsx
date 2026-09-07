"use client";

import { useEffect, useState } from "react";

// The BeforeInstallPromptEvent interface is not natively defined in TS dom, so we declare a minimal version
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // 1. Register Service Worker for production only
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Service Worker registered with scope:", registration.scope);
          })
          .catch((err) => {
            console.error("Service Worker registration failed:", err);
          });
      }
    }

    // 2. Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  if (!deferredPrompt) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "env(safe-area-inset-bottom, 16px)",
        left: "50%",
        transform: "translateX(-50%)",
        background: "var(--color-gold)",
        color: "#111",
        padding: "0.5rem 1rem",
        borderRadius: "var(--radius-lg)",
        boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        zIndex: 9999,
        fontSize: "0.875rem",
        fontWeight: "bold",
      }}
    >
      <span>Install DR DHL Fitness App</span>
      <button
        onClick={handleInstallClick}
        style={{
          background: "#111",
          color: "var(--color-gold)",
          border: "none",
          padding: "0.25rem 0.75rem",
          borderRadius: "var(--radius-sm)",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Install
      </button>
      <button
        onClick={() => setDeferredPrompt(null)}
        style={{
          background: "transparent",
          border: "none",
          color: "#111",
          cursor: "pointer",
          padding: "0.25rem",
          fontSize: "1rem",
        }}
        aria-label="Close install prompt"
      >
        ✕
      </button>
    </div>
  );
}
