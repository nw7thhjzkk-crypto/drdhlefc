import Image from "next/image";
import { VISUALS, type VisualId } from "@/lib/visuals";

export type StageKind = VisualId;

export function GymStage({
  kind,
  className = "",
}: {
  kind: StageKind;
  className?: string;
}) {
  const visual = VISUALS[kind] ?? VISUALS.floor;

  return (
    <div className={`gym-stage gym-stage-photo gym-stage-${kind} ${className}`.trim()}>
      {visual.src ? (
        <Image
          src={visual.src}
          alt={`${visual.label}. ${visual.caption}`}
          fill
          sizes="100vw"
          className="gym-photo"
          priority={kind === "arrival" || kind === "hero" || kind === "floor"}
        />
      ) : (
        <div className="gym-photo-void" aria-hidden="true" />
      )}
      <p className="gym-caption">{visual.caption}</p>
    </div>
  );
}
