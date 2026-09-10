import { EXPECTATIONS } from "@/lib/public-content";
import { SectionHeader } from "./SectionHeader";

export function Expect() {
  return (
    <section className="pub-section pub-expect">
      <div className="pub-wrap">
        <SectionHeader
          index="04"
          eyebrow="What you can expect"
          title="The tone of the club."
          body="Until the doors open, this is the character we are committing to. Equipment lists, amenities, and floor plans will follow with real photography — we will not invent them here."
        />
        <div className="pub-expect-grid">
          {EXPECTATIONS.map((item) => (
            <article key={item.title} className="pub-expect-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
