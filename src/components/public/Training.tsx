import { TRAINING_PILLARS } from "@/lib/public-content";
import { SectionHeader } from "./SectionHeader";

export function Training() {
  return (
    <section id="training" className="pub-section">
      <div className="pub-wrap">
        <SectionHeader
          index="03"
          eyebrow="Training"
          title="What the floor is for."
          body="We are building a club around serious training. Specific class calendars and named programmes will be published when they are confirmed — not before."
        />
        <div className="pub-pillars">
          {TRAINING_PILLARS.map((item, i) => (
            <article key={item.title} className="pub-pillar">
              <span className="pub-pillar-num" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
