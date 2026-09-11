import { SPACE_ZONES } from "@/lib/public-content";
import { GALLERY_SLOTS } from "@/lib/site";
import { PhotoFrame } from "./PhotoFrame";

export function Space() {
  const studies = GALLERY_SLOTS.filter((s) => s.id !== "hero");

  return (
    <section id="space" className="pub-section pub-space">
      <div className="pub-wrap">
        <header className="pub-space-head">
          <p className="pub-eyebrow">
            <span className="pub-rule" aria-hidden="true" />
            The Space
          </p>
          <h2 className="pub-h2">Inside the club.</h2>
          <p className="pub-lede">
            A planned sequence of rooms: arrival, the training floor, strength,
            free weights, cardio, changing, steam, and a small supplement store.
            Images below are visual studies of that intended environment — not
            photographs of the finished floor.
          </p>
        </header>

        <div className="pub-space-composition">
          {studies.map((slot) => (
            <PhotoFrame
              key={slot.id}
              label={slot.label}
              src={slot.src}
              study={slot.study}
              aspect={slot.id === "floor" ? "landscape" : slot.id === "work" ? "portrait" : "square"}
            />
          ))}
        </div>

        <ol className="pub-zones">
          {SPACE_ZONES.map((z, i) => (
            <li key={z.id}>
              <span className="pub-index" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>{z.title}</h3>
                <p>{z.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
