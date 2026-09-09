import { SectionHeader } from "./SectionHeader";

const PILLARS = [
  {
    title: "Strength",
    body: "Heavy, honest work. Progressive training for people who want to get stronger.",
  },
  {
    title: "Conditioning",
    body: "Capacity, pace, and athletic fitness — trained with intent, not noise.",
  },
  {
    title: "Personal guidance",
    body: "Coaching for those who want a tighter plan, clearer cues, and accountability.",
  },
  {
    title: "Progress",
    body: "A club that treats measurement as part of training, not an afterthought.",
  },
];

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
          {PILLARS.map((item) => (
            <article key={item.title} className="pub-pillar">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
