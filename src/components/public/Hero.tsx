import { BrandMark } from "./BrandMark";
import { GymStage } from "./GymStage";
import { site } from "@/lib/site";

export function Hero() {
  return (
    <section className="enter" aria-labelledby="pub-hero-title">
      <GymStage kind="floor" className="enter-stage" />
      <div className="enter-veil" />
      <div className="enter-copy">
        <BrandMark mark="full" size={420} priority className="enter-logo" />
        <p className="enter-eyebrow">{site.launchText}</p>
        <h1 id="pub-hero-title" className="sr-only">
          {site.name}
        </h1>
        <p className="enter-intent">
          A considered training environment in Bhuj — for people who want
          serious fitness, without the noise.
        </p>
        <div className="enter-cta">
          <a href="#access" className="pub-btn pub-btn-gold pub-btn-lg">
            Get Early Access
          </a>
          <a href="#space" className="pub-btn pub-btn-outline pub-btn-lg">
            Walk the floor
          </a>
        </div>
      </div>
    </section>
  );
}
