import { FACILITY_HIGHLIGHTS } from "@/lib/public-content";
import { GALLERY_SLOTS } from "@/lib/site";
import { PhotoFrame } from "./PhotoFrame";

const SPACE_ASPECT: Record<string, "landscape" | "portrait" | "square"> = {
  floor: "landscape",
  work: "portrait",
  club: "square",
};

export function Space() {
  const slots = GALLERY_SLOTS.filter((s) => s.id !== "hero");

  return (
    <section id="space" className="pub-section pub-space">
      <div className="pub-wrap">
        <header className="pub-space-head">
          <p className="pub-eyebrow">
            <span className="pub-rule" aria-hidden="true" />
            The Space
          </p>
          <h2 className="pub-h2">A room prepared for work.</h2>
          <p className="pub-lede">
            Photography of the finished floor will live here. Until then the
            frames stay empty on purpose — reserved, not filled with stock.
          </p>
        </header>

        <div className="pub-space-composition">
          {slots.map((slot) => (
            <PhotoFrame
              key={slot.id}
              label={slot.label}
              src={slot.src}
              aspect={SPACE_ASPECT[slot.id] ?? "landscape"}
            />
          ))}
        </div>

        {FACILITY_HIGHLIGHTS.length > 0 ? (
          <ul className="pub-space-notes">
            {FACILITY_HIGHLIGHTS.map((h) => (
              <li key={h.id}>
                <h3>{h.title}</h3>
                {h.description ? <p>{h.description}</p> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
