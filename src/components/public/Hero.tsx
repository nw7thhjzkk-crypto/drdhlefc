import { BrandMark } from "./BrandMark";
import { site } from "@/lib/site";

export function Hero() {
  return (
    <section className="pub-hero" aria-labelledby="pub-hero-title">
      <div className="pub-hero-glow" aria-hidden="true" />
      <div className="pub-hero-inner">
        <BrandMark size={168} priority className="pub-hero-mark" />
        <p className="pub-kicker">{site.launchText}</p>
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
    </section>
  );
}
