/**
 * Conceptual visualisations of the intended Dr DHL floor.
 * Files live in /public/visuals. Missing files stay null — do not point at stock.
 */
export const VISUAL_BIBLE = {
  architecture:
    "Open-plan club in Bhuj. Graphite walls, one mirrored long wall, glass to daylight, white linear ceiling lights, black rubber under lifting, glossy black circulation.",
  equipment:
    "Black commercial plate-loaded machines, racks, benches, dumbbells, cardio facing glass. Inspired by intended Jaguar-class commercial kit. Not installed. Not partnered.",
  grade: "Architectural photography. Cool-neutral grade. No neon. No smoke. No people posing.",
} as const;

export type VisualId =
  | "hero"
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

const PATH = {
  hero: "/visuals/01-hero-floor.webp",
  arrival: "/visuals/02-arrival.webp",
  office: "/visuals/03-office.webp",
  floor: "/visuals/01-hero-floor.webp",
  strength: "/visuals/04-strength.webp",
  free: "/visuals/05-free-weights.webp",
  cardio: "/visuals/06-cardio.webp",
  activity: "/visuals/07-activity.webp",
  pt: "/visuals/08-pt.webp",
  change: "/visuals/09-changing.webp",
  steam: "/visuals/10-steam.webp",
  store: "/visuals/11-store.webp",
} as const;

/** Flip a path on only after the file exists in public/visuals. */
const READY: Partial<Record<VisualId, boolean>> = {};

export const VISUALS: Record<
  VisualId,
  { src: string | null; label: string; caption: string }
> = {
  hero: { src: READY.hero ? PATH.hero : null, label: "Main floor", caption: "Conceptual visualisation — future club" },
  arrival: { src: READY.arrival ? PATH.arrival : null, label: "Arrival", caption: "Conceptual visualisation — future club" },
  office: { src: READY.office ? PATH.office : null, label: "Office", caption: "Conceptual visualisation — future club" },
  floor: { src: READY.floor ? PATH.floor : null, label: "Training floor", caption: "Conceptual visualisation — future club" },
  strength: { src: READY.strength ? PATH.strength : null, label: "Strength", caption: "Conceptual visualisation — future club" },
  free: { src: READY.free ? PATH.free : null, label: "Free weights", caption: "Conceptual visualisation — future club" },
  cardio: { src: READY.cardio ? PATH.cardio : null, label: "Cardio", caption: "Conceptual visualisation — future club" },
  activity: { src: READY.activity ? PATH.activity : null, label: "Activity room", caption: "Conceptual visualisation — future club" },
  pt: { src: READY.pt ? PATH.pt : null, label: "Personal training", caption: "Conceptual visualisation — future club" },
  change: { src: READY.change ? PATH.change : null, label: "Changing", caption: "Conceptual visualisation — future club" },
  steam: { src: READY.steam ? PATH.steam : null, label: "Steam", caption: "Conceptual visualisation — future club" },
  store: { src: READY.store ? PATH.store : null, label: "Store", caption: "Conceptual visualisation — future club" },
};
