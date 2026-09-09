import { SectionHeader } from "./SectionHeader";

const ITEMS = [
  {
    title: "A premium room",
    body: "Calm, ordered, and built for work — not a carnival of screens and slogans.",
  },
  {
    title: "A local club",
    body: "In Bhuj, for Bhuj. Easy to find, easy to visit, and serious about the people who train here.",
  },
  {
    title: "A clear standard",
    body: "Show up ready. Train with purpose. Leave knowing the session mattered.",
  },
];

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
          {ITEMS.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
