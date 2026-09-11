"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/public/BrandMark";
import { site } from "@/lib/site";

/**
 * Root error boundary.
 *
 * Catches unexpected render/data failures anywhere below the root layout
 * (public site and all portals) and shows a branded, recoverable screen
 * instead of the default unstyled error. Never exposes error internals
 * to the visitor; details stay in the console/server logs.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface for observability without leaking anything to the UI.
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="public-site pub-notfound">
      <main className="pub-notfound-wrap">
        <BrandMark size={88} priority />
        <p className="pub-kicker">Something went wrong</p>
        <h1>We hit a problem loading this page</h1>
        <p className="pub-notfound-lede">
          This is temporary. You can try again — nothing you submitted has
          been lost silently.
          {error.digest ? (
            <>
              {" "}
              Reference: <code>{error.digest}</code>
            </>
          ) : null}
        </p>
        <div className="pub-notfound-actions">
          <button
            type="button"
            onClick={reset}
            className="pub-btn pub-btn-gold pub-btn-lg"
          >
            Try again
          </button>
          <Link href="/" className="pub-btn pub-btn-outline pub-btn-lg">
            Back to the club
          </Link>
        </div>
      </main>
      <p className="pub-notfound-brand">
        © {new Date().getFullYear()} {site.name}
      </p>
    </div>
  );
}
