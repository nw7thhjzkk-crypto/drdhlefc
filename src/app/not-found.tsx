import Link from "next/link";
import { BrandMark } from "@/components/public/BrandMark";
import { site } from "@/lib/site";

export default function NotFound() {
  return (
    <div className="public-site pub-notfound">
      <main className="pub-notfound-wrap">
        <BrandMark size={88} priority />
        <p className="pub-kicker">404</p>
        <h1>Page not found</h1>
        <p className="pub-notfound-lede">
          The page you were looking for does not exist or has moved.
        </p>
        <div className="pub-notfound-actions">
          <Link href="/" className="pub-btn pub-btn-gold pub-btn-lg">
            Back to the club
          </Link>
          <Link href="/login" className="pub-btn pub-btn-outline pub-btn-lg">
            Login
          </Link>
        </div>
      </main>
      <p className="pub-notfound-brand">© {new Date().getFullYear()} {site.name}</p>
    </div>
  );
}
