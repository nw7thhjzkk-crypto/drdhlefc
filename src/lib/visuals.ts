/**
 * Conceptual visualisations of the intended Dr DHL floor.
 * Files live in /public/visuals. Missing files must stay null — do not point at stock.
 */
export const VISUAL_BIBLE = {
  architecture: "Open-plan club in Bhuj. Graphite walls, one mirrored long wall, glass to daylight, white linear ceiling lights, black rubber under lifting, glossy black circulation.",
  equipment: "Black commercial plate-loaded machines, racks, benches, dumbbells, cardio facing glass. Inspired by intended Jaguar-class commercial kit. Not installed. Not partnered.",
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

export const VISUALS: Record<
  VisualId,
  { src: string | null; label: string; caption: string }
> = {
  hero: {
    src: "/visuals/01-hero-floor.webp",
    label: "Main floor",
    caption: "Conceptual visualisation — future club",
  },
  arrival: {
    src: "/visuals/02-arrival.webp",
    label: "Arrival",
    caption: "Conceptual visualisation — future club",
  },
  office: {
    src: "/visuals/03-office.webp",
    label: "Office",
    caption: "Conceptual visualisation — future club",
  },
  floor: {
    src: "/visuals/01-hero-floor.webp",
    label: "Training floor",
    caption: "Conceptual visualisation — future club",
  },
  strength: {
    src: "/visuals/04-strength.webp",
    label: "Strength",
    caption: "Conceptual visualisation — future club",
  },
  free: {
    src: "/visuals/05-free-weights.webp",
    label: "Free weights",
    caption: "Conceptual visualisation — future club",
  },
  cardio: {
    src: "/visuals/06-cardio.webp",
    label: "Cardio",
    caption: "Conceptual visualisation — future club",
  },
  activity: {
    src: "/visuals/07-activity.webp",
    label: "Activity room",
    caption: "Conceptual visualisation — future club",
  },
  pt: {
    src: "/visuals/08-pt.webp",
    label: "Personal training",
    caption: "Conceptual visualisation — future club",
  },
  change: {
    src: "/visuals/09-changing.webp",
    label: "Changing",
    caption: "Conceptual visualisation — future club",
  },
  steam: {
    src: "/visuals/10-steam.webp",
    label: "Steam",
    caption: "Conceptual visualisation — future club",
  },
  store: {
    src: "/visuals/11-store.webp",
    label: "Store",
    caption: "Conceptual visualisation — future club",
  },
};
