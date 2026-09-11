import { GymStage } from "./GymStage";
import { LogoPlaque } from "./LogoPlaque";
import { site } from "@/lib/site";

export function Hero() {
  return (
    <section className="enter" aria-labelledby="pub-hero-title">
      <GymStage kind="arrival" className="enter-stage" />
      <div className="enter-veil" />
      <div className="enter-grid">
        <LogoPlaque size={380} priority caption="Dr DHL Elite Fitness Club" />
        <div className="enter-copy">
          <p className="enter-eyebrow">{site.launchText}</p>
          <h1 id="pub-hero-title">{site.name}</h1>
          <p className="enter-intent">
            A considered training environment in Bhuj — for people who want
            serious fitness, without the noise.
          </p>
          <div className="enter-cta">
            <a href="#access" className="pub-btn pub-btn-gold pub-btn-lg">
              Get Early Access
            </a>
            <a href="#space" className="pub-btn pub-btn-outline pub-btn-lg">
              Enter the club
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
