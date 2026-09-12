import Link from "next/link";

export const metadata = {
  title: "Demo — Dr DHL Elite Fitness Club",
  description: "Experience the Dr DHL Elite Fitness Club platform with synthetic demo data.",
  robots: { index: false, follow: false },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="public-site demo-shell">
      <div className="demo-banner">
        <span className="demo-banner-dot" />
        <span className="demo-banner-text">DEMO MODE</span>
        <span className="demo-banner-sep">·</span>
        <span className="demo-banner-hint">
          Synthetic data only — no real production data is shown
        </span>
        <Link href="/login" className="demo-banner-exit">
          Exit Demo →
        </Link>
      </div>
      {children}
    </div>
  );
}
