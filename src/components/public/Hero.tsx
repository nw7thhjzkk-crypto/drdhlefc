import { BrandMark } from "./BrandMark";
import { site } from "@/lib/site";

export function Hero() {
  return (
    <section className="pub-hero" aria-labelledby="pub-hero-title">
      <div className="pub-hero-inner">
        <div className="pub-hero-mark">
          <BrandMark size={96} priority />
        </div>

        <div className="pub-hero-eyebrow">
          <span className="pub-hero-rule" aria-hidden="true" />
          <span>{site.launchText}</span>
          <span className="pub-hero-rule" aria-hidden="true" />
        </div>

        <h1 id="pub-hero-title" className="pub-hero-title">
          Dr DHL
          <span className="pub-hero-title-sub">Elite Fitness Club</span>
        </h1>

        <p className="pub-hero-tag">Premium Fitness in Bhuj</p>

        <div className="pub-hero-copy">
          <p className="pub-hero-intent">
            A considered training environment for people who want serious
            fitness, without the noise.
          </p>
        </div>

        <div className="pub-hero-cta">
          <a href="#access" className="pub-btn pub-btn-gold pub-btn-lg" aria-label="Get early access to Dr DHL Elite Fitness Club">
            Get Early Access
          </a>
          <a href="/login" className="pub-btn pub-btn-outline pub-btn-lg" aria-label="Member login portal">
            Member Login
          </a>
        </div>
      </div>

      <a href="#club" className="pub-hero-scroll" aria-label="Scroll to content">
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </a>
    </section>
  );
}
