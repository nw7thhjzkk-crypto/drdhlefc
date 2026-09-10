import { site } from "@/lib/site";

export function FinalCta() {
  return (
    <section className="pub-section pub-final">
      <div className="pub-wrap pub-final-inner">
        <p className="pub-kicker">
          {site.address.locality} · {site.address.region}
        </p>
        <h2 className="pub-display-sm">Train at Dr DHL.</h2>
        <p className="pub-lede">
          Premium fitness in Bhuj. Register your interest, or log in if you
          already have access.
        </p>
        <div className="pub-hero-cta">
          <a href="#access" className="pub-btn pub-btn-gold pub-btn-lg">
            Get Early Access
          </a>
          <a href="/login" className="pub-btn pub-btn-outline pub-btn-lg">
            Login
          </a>
        </div>
      </div>
    </section>
  );
}
