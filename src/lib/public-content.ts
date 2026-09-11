import { site } from "./site";

export type TrainingPillar = {
  title: string;
  body: string;
};

export const TRAINING_PILLARS: TrainingPillar[] = [
  {
    title: "Strength",
    body: "Plate-loaded machines, racks, and progressive work for people who want to get stronger.",
  },
  {
    title: "Free weights",
    body: "Dumbbells, bars, benches, and room to lift without crowding the floor.",
  },
  {
    title: "Cardio",
    body: "A quieter line of machines for capacity work — not a wall of screens.",
  },
  {
    title: "Functional & group",
    body: "An open activity floor for conditioning and sessions. Timetables publish when confirmed.",
  },
  {
    title: "Personal training",
    body: "Coaching for a tighter plan, clearer cues, and accountability.",
  },
  {
    title: "Recovery",
    body: "Changing, shower, and steam after the work — then back onto the street.",
  },
];

export type ExperienceStep = {
  title: string;
  body: string;
};

export const EXPERIENCE_STEPS: ExperienceStep[] = [
  { title: "Assessment", body: "Understand where you are before the work begins." },
  { title: "Goal", body: "Set a direction that is specific enough to train toward." },
  { title: "Training", body: "Show up to structured sessions in a focused room." },
  { title: "Progress", body: "Measure what changed — not just how it felt." },
  { title: "Adjustment", body: "Refine the plan when the body and the data ask for it." },
  { title: "Results", body: "Keep the work honest. Keep the standard high." },
];

export type Expectation = {
  title: string;
  body: string;
};

export const EXPECTATIONS: Expectation[] = [
  {
    title: "A premium room",
    body: "Black equipment, white light, ordered floor — not a carnival of slogans.",
  },
  {
    title: "A local club",
    body: "In Bhuj, for Bhuj. Easy to find, easy to visit, and serious about the people who train here.",
  },
  {
    title: "A clear standard",
    body: "Show up ready. Train with purpose. Leave knowing the session mattered.",
  },
];

export type MembershipPillar = {
  title: string;
  body: string;
};

export const MEMBERSHIP_PILLARS: MembershipPillar[] = [
  {
    title: "Access to the floor",
    body: "A focused training space you can rely on — kept clean and in order.",
  },
  {
    title: "Structured guidance",
    body: "Programming and coaching, not just access to equipment.",
  },
  {
    title: "A serious standard",
    body: "A calm, disciplined room where the work comes first.",
  },
  {
    title: "Honest onboarding",
    body: "The standard we are building toward: an assessment before a plan.",
  },
];

export type Activity = {
  id: string;
  name: string;
  description: string | null;
  schedule: string | null;
};

export const ACTIVITIES: Activity[] = [];

export type TrainerProfile = {
  id: string;
  name: string;
  role: string;
  photo: string | null;
  bio: string | null;
};

export const TRAINER_PROFILES: TrainerProfile[] = [];

export type FacilityHighlight = {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
};

export const FACILITY_HIGHLIGHTS: FacilityHighlight[] = [];

export type SpaceZone = {
  id: string;
  title: string;
  body: string;
};

export const SPACE_ZONES: SpaceZone[] = [
  { id: "arrival", title: "Arrival", body: "From the street into a quiet welcome — not a queue under fluorescent light." },
  { id: "floor", title: "Main training floor", body: "The heart of the club: black machines, racks, and a floor kept ready for work." },
  { id: "strength", title: "Strength",
    body: "Plate-loaded stations and machines intended for serious loading, spaced so a set can finish." },
  { id: "free", title: "Free weights", body: "Dumbbells, bars, benches, and racks — the simple tools, kept in order." },
  { id: "functional", title: "Activity floor", body: "An open zone for conditioning and group work. Named classes publish when confirmed." },
  { id: "cardio", title: "Cardio", body: "A short line of machines for capacity — away from the heaviest lifting." },
  { id: "pt", title: "Personal training", body: "A quieter edge of the floor for coached sessions." },
  { id: "change", title: "Changing & shower", body: "Lockers, washrooms, and showers after the session." },
  { id: "steam", title: "Steam room", body: "Heat and quiet after training — not a spa menu." },
  { id: "store", title: "Supplement store", body: "A small counter for training support. Brands and prices are not listed yet." },
];

export type Amenity = {
  id: string;
  zone: string;
  title: string;
  body: string;
};

export const AMENITIES: Amenity[] = [
  { id: "floor", zone: "Train", title: "Premium training floor", body: "The main room: strength, free weights, and space to work." },
  { id: "strength", zone: "Train", title: "Strength area", body: "Machines and racks planned around commercial black equipment." },
  { id: "free", zone: "Train", title: "Free weights", body: "Dumbbells, plates, bars, and benches." },
  { id: "functional", zone: "Train", title: "Activity areas", body: "Functional and group work. No timetable is published yet." },
  { id: "cardio", zone: "Train", title: "Cardio area", body: "Capacity work without turning the club into a screen wall." },
  { id: "pt", zone: "Coach", title: "Personal training", body: "Coached sessions on the floor when the team is confirmed." },
  { id: "change", zone: "After", title: "Changing facilities", body: "A place to arrive and leave without carrying the session onto the street." },
  { id: "shower", zone: "After", title: "Showers", body: "Hot water after the work." },
  { id: "wash", zone: "After", title: "Washrooms", body: "Toilets and washbasins kept to the same standard as the floor." },
  { id: "steam", zone: "After", title: "Steam room", body: "Steam after training. No sauna, pool, or jacuzzi is part of this plan." },
  { id: "store", zone: "Support", title: "Supplement store", body: "A compact store for nutrition and convenience — not an online shop yet." },
  { id: "recover", zone: "After", title: "Recovery",
    body: "The rooms after the floor: change, wash, steam, then out." },
];

export type FaqItem = {
  q: string;
  a: string;
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "What is Dr DHL Elite Fitness Club?",
    a: "A premium fitness club in Bhuj, Gujarat. We are preparing a focused training environment for strength, conditioning, and personal guidance.",
  },
  {
    q: "Where is the gym located?",
    a: `${site.address.lines.join(", ")}.`,
  },
  {
    q: "How can I register my interest?",
    a: "Use Get Early Access on this website. That sends your details to our team as an enquiry — it does not create a membership or an account.",
  },
  {
    q: "When will membership details be available?",
    a: "Soon. Prices, packages, and benefits have not been published yet. We will contact people who register interest when they are ready.",
  },
  {
    q: "When does the club open?",
    a: "The club is coming soon. An opening date has not been announced.",
  },
  {
    q: "How can I contact the gym?",
    a: `Email ${site.email}. You can also follow ${site.instagramHandle} on Instagram.`,
  },
  {
    q: "Can I follow the gym on Instagram?",
    a: `Yes — ${site.instagramHandle} at instagram.com/drdhlefc.`,
  },
];
