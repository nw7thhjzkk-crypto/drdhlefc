import { site } from "./site";

/**
 * Public website content, as simple typed configuration.
 *
 * Every array below is the single source of truth for its section. When real
 * data becomes available (coach profiles, facility details, a class
 * timetable, membership plans), add it here and the existing components will
 * render it — no redesign required.
 *
 * Empty arrays intentionally render refined "coming soon" states rather than
 * fabricated content. Do not invent names, prices, schedules, credentials,
 * or photography to fill these structures.
 */

/* ---------------------------------------------------------------- */
/* Training pillars (philosophy — not a fabricated class timetable)  */
/* ---------------------------------------------------------------- */

export type TrainingPillar = {
  title: string;
  body: string;
};

export const TRAINING_PILLARS: TrainingPillar[] = [
  {
    title: "Strength",
    body: "Progressive, honest work for people who want to get stronger.",
  },
  {
    title: "Conditioning",
    body: "Capacity and pace built with intent, not noise.",
  },
  {
    title: "Personal guidance",
    body: "Coaching for a tighter plan, clearer cues, and accountability.",
  },
  {
    title: "Progress",
    body: "Measurement treated as part of training, not an afterthought.",
  },
];

/* ---------------------------------------------------------------- */
/* The training experience (structured journey)                      */
/* ---------------------------------------------------------------- */

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

/* ---------------------------------------------------------------- */
/* What you can expect (the tone of the club)                        */
/* ---------------------------------------------------------------- */

export type Expectation = {
  title: string;
  body: string;
};

export const EXPECTATIONS: Expectation[] = [
  {
    title: "A premium room",
    body: "Calm, ordered, and built for work — not a carnival of screens and slogans.",
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

/* ---------------------------------------------------------------- */
/* Membership discovery (no invented prices or packages)             */
/* ---------------------------------------------------------------- */

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

/* ---------------------------------------------------------------- */
/* Group training / activities (empty until a timetable is confirmed) */
/* ---------------------------------------------------------------- */

export type Activity = {
  id: string;
  name: string;
  description: string | null;
  /** Human-readable schedule line, e.g. "Mon · Wed · Fri — 7:00 AM". */
  schedule: string | null;
};

export const ACTIVITIES: Activity[] = [];

/* ---------------------------------------------------------------- */
/* Trainers (empty until real coach profiles are confirmed)          */
/* ---------------------------------------------------------------- */

export type TrainerProfile = {
  id: string;
  name: string;
  role: string;
  /** Public photo path. Leave null until real photography is supplied. */
  photo: string | null;
  bio: string | null;
};

export const TRAINER_PROFILES: TrainerProfile[] = [];

/* ---------------------------------------------------------------- */
/* Facilities (empty until the finished floor is confirmed)          */
/* ---------------------------------------------------------------- */

export type FacilityHighlight = {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
};

export const FACILITY_HIGHLIGHTS: FacilityHighlight[] = [];

/* ---------------------------------------------------------------- */
/* FAQ                                                               */
/* ---------------------------------------------------------------- */

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
