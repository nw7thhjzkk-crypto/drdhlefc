import { ACTIVITIES } from "@/lib/public-content";
import { SectionHeader } from "./SectionHeader";
import { BrandMark } from "./BrandMark";

export function Activities() {
  return (
    <section id="activities" className="pub-section pub-activities">
      <div className="pub-wrap">
        <SectionHeader
          index="06"
          eyebrow="Group training"
          title="Sessions with intent."
          body="We are designing group training around the same standard as the rest of the club. A class timetable will be published when sessions and coaches are confirmed — we will not list classes that do not exist yet."
        />

        {ACTIVITIES.length > 0 ? (
          <div className="pub-activities-grid">
            {ACTIVITIES.map((a) => (
              <article key={a.id} className="pub-activity-card">
                <h3>{a.name}</h3>
                {a.schedule ? (
                  <p className="pub-activity-schedule">{a.schedule}</p>
                ) : null}
                {a.description ? <p>{a.description}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="pub-coming-panel pub-coming-panel-wide">
            <BrandMark size={56} />
            <h3>Timetable to be announced</h3>
            <p>
              Class names, schedules, and capacity will be published together
              when they are confirmed. Register your interest and you will hear
              first.
            </p>
            <a href="#access" className="pub-btn pub-btn-outline">
              Get Early Access
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
