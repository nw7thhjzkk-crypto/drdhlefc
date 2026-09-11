import { BrandMark } from "./BrandMark";
import { PhotoFrame } from "./PhotoFrame";
import { GALLERY_SLOTS, site } from "@/lib/site";

export function Hero() {
  const plate = GALLERY_SLOTS.find((s) => s.id === "hero") ?? null;

  return (
    <section className="pub-hero" aria-labelledby="pub-hero-title">
      <div className="pub-hero-stage">
        {plate ? (
          <PhotoFrame
            label={plate.label}
            src={plate.src}
            study={plate.study}
            aspect="hero"
            className="pub-hero-plate"
          />
        ) : (
          <div className="pub-hero-plate pub-hero-plate-void" aria-hidden="true" />
        )}
        <div className="pub-hero-veil" aria-hidden="true" />
      </div>

      <div className="pub-hero-copyblock">
        <BrandMark size={56} priority className="pub-hero-mark" />
        <p className="pub-hero-eyebrow">
          <span className="pub-hero-rule" aria-hidden="true" />
          {site.launchText}
        </p>
        <h1 id="pub-hero-title" className="pub-display">
          <span className="pub-display-top">Dr DHL</span>
          <span className="pub-display-sub">Elite Fitness Club</span>
        </h1>
        <p className="pub-hero-intent">
          A considered training environment in Bhuj — for people who want
          serious fitness, without the noise.
        </p>
        <div className="pub-hero-cta">
          <a href="#access" className="pub-btn pub-btn-gold pub-btn-lg">
            Get Early Access
          </a>
          <a href="#space" className="pub-btn pub-btn-outline pub-btn-lg">
            See the floor
          </a>
        </div>
      </div>
    </section>
  );
}
