import { EXPECTATIONS } from "@/lib/public-content";
import { site } from "@/lib/site";
import { BrandMark } from "./BrandMark";

export function About() {
  return (
    <section id="club" className="pub-section pub-about">
      <div className="pub-wrap pub-about-grid">
        <div className="pub-logo-panel">
          <BrandMark mark="full" size={380} className="pub-full-logo" />
        </div>
        <div>
          <p className="pub-eyebrow">
            <span className="pub-rule" aria-hidden="true" />
            The Club
          </p>
          <h2 className="pub-h2">Bhuj. Open floor. Quiet work.</h2>
          <p className="pub-lede">
            One room for training. Glass to the street. A mirrored wall.
            An office at the door. Changing, shower, steam, a small store.
          </p>
          <p className="pub-body">
            {site.name} is {site.launchText.toLowerCase()}. What follows is a
            conceptual walk through the intended building — not a photograph
            of a finished gym.
          </p>
          <div className="pub-expect-grid">
            {EXPECTATIONS.map((item) => (
              <div key={item.title} className="pub-expect-card">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
