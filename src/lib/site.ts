/**
 * Canonical public-website business information.
 * Missing channels stay null — never invent phone, WhatsApp, or Facebook URLs.
 */

export const LAUNCH_STATUS = "PRE_LAUNCH" as const;
export const LAUNCH_TEXT = "Coming Soon";

export const site = {
  name: "Dr DHL Elite Fitness Club",
  shortName: "Dr DHL",
  tagline: "Premium Fitness in Bhuj",
  launchStatus: LAUNCH_STATUS,
  launchText: LAUNCH_TEXT,
  openingDate: null,
  openingMonth: null,

  email: "drdhlefc@gmail.com",
  phone: null as string | null,
  whatsapp: null as string | null,

  instagramHandle: "DRDHLEFC",
  instagramUrl: "https://www.instagram.com/drdhlefc/",
  facebookName: "Dr DHL Elite Fitness Club",
  facebookUrl: null as string | null,

  address: {
    lines: [
      "Shop No. 201–204",
      "Bhagwati Heritage",
      "Near Sanskar Nagar",
      "Bhuj, Gujarat",
      "India – 370001",
    ],
    locality: "Bhuj",
    region: "Gujarat",
    postalCode: "370001",
    country: "IN",
    countryName: "India",
  },

  mapsSearchUrl:
    "https://www.google.com/maps/search/?api=1&query=Shop%20No.%20201-204%2C%20Bhagwati%20Heritage%2C%20Near%20Sanskar%20Nagar%2C%20Bhuj%2C%20Gujarat%20370001",

  brand: {
    fullLogo: "/brand/dr-dhl-elite-fitness-club-logo.png",
    fullLogoClear: "/brand/dr-dhl-elite-fitness-club-logo-transparent.png",
    monogram: "/brand/dr-dhl-monogram.png",
  },
} as const;

export const FITNESS_GOALS = [
  { value: "weight-loss", label: "Weight Loss" },
  { value: "muscle-gain", label: "Muscle Gain" },
  { value: "general-fitness", label: "General Fitness" },
  { value: "strength", label: "Strength" },
  { value: "endurance", label: "Endurance" },
  { value: "personal-training", label: "Personal Training" },
  { value: "other", label: "Other" },
] as const;

export const INTERESTS = [
  { value: "early-access", label: "Early Access" },
  { value: "membership", label: "Membership Information" },
  { value: "personal-training", label: "Personal Training" },
  { value: "strength", label: "Strength Training" },
  { value: "general", label: "General Enquiry" },
] as const;

export const GALLERY_SLOTS: ReadonlyArray<{
  id: string;
  label: string;
  src: string | null;
  study?: boolean;
}> = [
  { id: "hero", label: "Training floor", src: "/visuals/01-hero-floor.webp", study: true },
  { id: "floor", label: "Strength", src: "/visuals/04-strength.webp", study: true },
  { id: "work", label: "Free weights", src: "/visuals/05-free-weights.webp", study: true },
  { id: "club", label: "Cardio", src: "/visuals/06-cardio.webp", study: true },
];

export type FitnessGoal = (typeof FITNESS_GOALS)[number]["value"];
export type Interest = (typeof INTERESTS)[number]["value"];

export function siteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return "http://localhost:3000";
}

export function formattedAddress(separator = "\n"): string {
  return site.address.lines.join(separator);
}
