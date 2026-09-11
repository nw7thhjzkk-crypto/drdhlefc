"use client";

import { useEffect } from "react";

/**
 * Global error boundary — last resort when the root layout itself fails.
 * Must render its own <html>/<body> and cannot rely on app CSS, fonts,
 * or components, so styling is minimal and inline.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Fatal application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0A",
          color: "#E4E4E7",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "28rem" }}>
          <p
            style={{
              color: "#D4AF37",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontSize: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            Dr DHL Elite Fitness Club
          </p>
          <h1 style={{ fontSize: "1.5rem", margin: "0 0 0.75rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#8A8B8F", margin: "0 0 1.5rem" }}>
            An unexpected error occurred. Please try again.
            {error.digest ? ` (Ref: ${error.digest})` : ""}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#D4AF37",
              color: "#0A0A0A",
              border: "none",
              padding: "0.85rem 1.75rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontSize: "0.8rem",
              cursor: "pointer",
              borderRadius: "2px",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
