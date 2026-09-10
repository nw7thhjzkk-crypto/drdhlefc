import { BrandMark } from "./BrandMark";
import { site } from "@/lib/site";

export function Hero() {
  return (
    <section className="pub-hero" aria-labelledby="pub-hero-title">
      <div className="pub-hero-inner">
        <BrandMark size={150} priority className="pub-hero-mark" />
        <p className="pub-hero-eyebrow">
          <span className="pub-hero-rule" aria-hidden="true" />
          {site.launchText}
          <span className="pub-hero-rule" aria-hidden="true" />
        </p>
        <h1 id="pub-hero-title" className="pub-display">
          <span className="pub-display-top">Dr DHL</span>
          <span className="pub-display-sub">Elite Fitness Club</span>
        </h1>
        <p className="pub-hero-tag">{site.tagline}</p>
        <p className="pub-hero-copy">
          A considered training environment in Bhuj — for people who want
          serious fitness, without the noise.
        </p>
        <div className="pub-hero-cta">
          <a href="#access" className="pub-btn pub-btn-gold pub-btn-lg">
            Get Early Access
          </a>
          <a href="#club" className="pub-btn pub-btn-outline pub-btn-lg">
            Explore the Club
          </a>
        </div>
      </div>
      <a href="#club" className="pub-hero-scroll" aria-label="Scroll to the club">
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 5v14M6 13l6 6 6-6" />
        </svg>
      </a>
    </section>
  );
}
