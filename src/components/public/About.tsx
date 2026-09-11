import { BrandMark } from "./BrandMark";
import { EXPECTATIONS } from "@/lib/public-content";
import { site } from "@/lib/site";

export function About() {
  return (
    <section id="club" className="pub-section pub-club">
      <div className="pub-wrap pub-club-grid">
        <div className="pub-club-copy">
          <p className="pub-eyebrow">
            <span className="pub-rule" aria-hidden="true" />
            The Club
          </p>
          <h2 className="pub-h2">Built for training that lasts.</h2>
          <p className="pub-lede">
            Dr DHL Elite Fitness Club is a premium fitness club in Bhuj — a
            serious, well-run space for strength, conditioning, and personal
            guidance.
          </p>
          <p className="pub-body">
            The club is {site.launchText.toLowerCase()}. Membership details
            will be shared when they are ready. If you want to train here from
            the beginning, register your interest and we will be in touch.
          </p>
        </div>

        <ol className="pub-convictions">
          {EXPECTATIONS.map((item) => (
            <li key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="pub-wrap pub-club-mark">
        <BrandMark mark="full" size={280} className="pub-full-logo" />
      </div>
    </section>
  );
}
