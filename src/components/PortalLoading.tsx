/**
 * Shared loading state for the ERP portals (owner / trainer / member).
 * Pure CSS pulse — respects prefers-reduced-motion via Tailwind's
 * motion-safe variant. Announced to screen readers via role="status".
 */
export default function PortalLoading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="p-8 max-w-7xl mx-auto space-y-6"
    >
      <div className="h-8 w-56 rounded bg-zinc-800 motion-safe:animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-28 rounded-lg border border-zinc-800 bg-zinc-900 motion-safe:animate-pulse"
          />
        ))}
      </div>
      <div className="h-64 rounded-lg border border-zinc-800 bg-zinc-900 motion-safe:animate-pulse" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
