import Link from "next/link";
import { BrandMark } from "./BrandMark";
import { site } from "@/lib/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="pub-footer">
      <div className="pub-wrap pub-footer-grid">
        <div>
          <BrandMark size={48} />
          <p className="pub-footer-name">{site.name}</p>
          <p className="pub-footer-tag">{site.tagline}</p>
        </div>
        <div>
          <p className="pub-label">Visit</p>
          <address>
            {site.address.lines.map((line) => (
              <span key={line}>
                {line}
                <br />
              </span>
            ))}
          </address>
        </div>
        <div>
          <p className="pub-label">Contact</p>
          <a href={`mailto:${site.email}`}>{site.email}</a>
          <br />
          <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer">
            Instagram @{site.instagramHandle.toLowerCase()}
          </a>
          <p className="pub-plain">{site.facebookName}</p>
        </div>
        <nav aria-label="Footer">
          <p className="pub-label">Club</p>
          <Link href="/#club">The Club</Link>
          <Link href="/#training">Training</Link>
          <Link href="/#memberships">Memberships</Link>
          <Link href="/#access">Early Access</Link>
          <Link href="/login">Login</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </div>
      <div className="pub-wrap pub-footer-base">
        <p>
          © {year} {site.name}. All rights reserved.
        </p>
        <p>{site.launchText} · Bhuj, Gujarat</p>
      </div>
    </footer>
  );
}
