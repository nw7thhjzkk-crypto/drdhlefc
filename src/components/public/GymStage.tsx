/**
 * Original architectural stage for the intended Dr DHL floor.
 * Not a photograph of the finished club.
 */
export type StageKind =
  | "arrival"
  | "office"
  | "floor"
  | "strength"
  | "free"
  | "cardio"
  | "activity"
  | "pt"
  | "change"
  | "steam"
  | "store";

export function GymStage({
  kind,
  className = "",
}: {
  kind: StageKind;
  className?: string;
}) {
  return (
    <div className={`gym-stage gym-stage-${kind} ${className}`.trim()} aria-hidden="true">
      <div className="gym-ceil" />
      <div className="gym-lights">
        <span /><span /><span /><span /><span /><span />
      </div>
      <div className="gym-mirror" />
      <div className="gym-glass" />
      <div className="gym-floor" />
      <div className="gym-rubber" />
      <div className="gym-equip gym-equip-a" />
      <div className="gym-equip gym-equip-b" />
      <div className="gym-equip gym-equip-c" />
      <div className="gym-rack" />
      <div className="gym-desk" />
      <div className="gym-shelf" />
      <div className="gym-mark-wall" />
      <div className="gym-steam" />
      <p className="gym-caption">Conceptual visualisation — future club</p>
    </div>
  );
}
