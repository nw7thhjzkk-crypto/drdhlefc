import {
  FITNESS_GOALS,
  INTERESTS,
  type FitnessGoal,
  type Interest,
} from "./site";

export type WebsiteLeadInput = {
  name: string;
  phone: string;
  email: string;
  goal: string;
  interest: string;
  message: string;
  /** Honeypot — must be empty. */
  company?: string;
};

export type FieldErrors = Partial<
  Record<"name" | "phone" | "email" | "goal" | "interest" | "message", string>
>;

export type LeadValidation =
  | { ok: true; data: NormalizedLead; spam: boolean }
  | { ok: false; fieldErrors: FieldErrors };

export type NormalizedLead = {
  name: string;
  phone: string;
  email: string | null;
  goal: FitnessGoal;
  interest: Interest;
  message: string | null;
};

const GOAL_VALUES = new Set<string>(FITNESS_GOALS.map((g) => g.value));
const INTEREST_VALUES = new Set<string>(INTERESTS.map((i) => i.value));

export function normalizeIndianMobile(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let d = digits;
  if (d.startsWith("91") && d.length === 12) d = d.slice(2);
  if (d.length === 10 && /^[6-9]/.test(d)) return d;
  return null;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 120;
}

function cleanText(value: string, max: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export function validateWebsiteLead(raw: WebsiteLeadInput): LeadValidation {
  if (raw.company && raw.company.trim() !== "") {
    return {
      ok: true,
      spam: true,
      data: {
        name: "spam",
        phone: "0000000000",
        email: null,
        goal: "other",
        interest: "general",
        message: null,
      },
    };
  }

  const fieldErrors: FieldErrors = {};
  const name = cleanText(raw.name ?? "", 80);
  if (name.length < 2) fieldErrors.name = "Please enter your name.";

  const phone = normalizeIndianMobile(raw.phone ?? "");
  if (!phone) fieldErrors.phone = "Enter a valid 10-digit Indian mobile number.";

  const emailRaw = cleanText(raw.email ?? "", 120).toLowerCase();
  let email: string | null = null;
  if (emailRaw) {
    if (!isEmail(emailRaw)) fieldErrors.email = "Enter a valid email address.";
    else email = emailRaw;
  }

  const goal = (raw.goal ?? "").trim();
  if (!GOAL_VALUES.has(goal)) fieldErrors.goal = "Please choose a fitness goal.";

  const interest = (raw.interest ?? "").trim();
  if (!INTEREST_VALUES.has(interest)) {
    fieldErrors.interest = "Please choose an interest.";
  }

  const messageRaw = cleanText(raw.message ?? "", 1000);
  const message = messageRaw.length > 0 ? messageRaw : null;

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    spam: false,
    data: {
      name,
      phone: phone as string,
      email,
      goal: goal as FitnessGoal,
      interest: interest as Interest,
      message,
    },
  };
}

export function formatLeadNotes(data: NormalizedLead): string {
  const lines = [
    `Goal: ${FITNESS_GOALS.find((g) => g.value === data.goal)?.label ?? data.goal}`,
    `Interest: ${INTERESTS.find((i) => i.value === data.interest)?.label ?? data.interest}`,
  ];
  if (data.message) lines.push(`Message: ${data.message}`);
  return lines.join("\n");
}
