import { ACTIVITIES, TRAINING_PILLARS } from "@/lib/public-content";

export function Training() {
  return (
    <section id="training" className="pub-section pub-training">
      <div className="pub-wrap">
        <header className="pub-training-head">
          <p className="pub-eyebrow">
            <span className="pub-rule" aria-hidden="true" />
            Training
          </p>
          <h2 className="pub-h2">What the floor is for.</h2>
          <p className="pub-lede">
            We are building a club around serious training. Specific class
            calendars and named programmes will be published when they are
            confirmed — not before.
          </p>
        </header>

        <ol className="pub-index-list">
          {TRAINING_PILLARS.map((item, i) => (
            <li key={item.title}>
              <span className="pub-index" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </li>
          ))}
        </ol>

        {ACTIVITIES.length === 0 ? (
          <p className="pub-quiet-note">
            Group sessions will be published when the timetable is confirmed.
          </p>
        ) : (
          <ul className="pub-activity-lines">
            {ACTIVITIES.map((a) => (
              <li key={a.id}>
                <strong>{a.name}</strong>
                {a.schedule ? <span>{a.schedule}</span> : null}
                {a.description ? <p>{a.description}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
