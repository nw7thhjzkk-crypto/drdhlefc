import { SPACE_ZONES } from "@/lib/public-content";
import { GymStage, type StageKind } from "./GymStage";

const KIND: Record<string, StageKind> = {
  arrival: "arrival",
  floor: "floor",
  strength: "strength",
  free: "free",
  functional: "activity",
  cardio: "cardio",
  pt: "pt",
  change: "change",
  steam: "steam",
  store: "store",
};

export function Walk() {
  return (
    <section id="space" className="walk" aria-label="Walk through the club">
      {SPACE_ZONES.map((zone, i) => {
        const kind = KIND[zone.id] ?? "floor";
        return (
          <article key={zone.id} className="walk-room" id={zone.id === "arrival" ? "enter" : undefined}>
            <div className="walk-pin">
              <GymStage kind={kind} />
              <div className="walk-copy">
                <p className="walk-index">{String(i + 1).padStart(2, "0")}</p>
                <h2>{zone.title}</h2>
                <p>{zone.body}</p>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
