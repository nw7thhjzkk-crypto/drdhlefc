import { describe, expect, it } from "vitest";
import {
  formatLeadNotes,
  mapSubmitLeadError,
  normalizeIndianMobile,
  validateWebsiteLead,
} from "./website-lead";

describe("normalizeIndianMobile", () => {
  it("accepts a 10-digit mobile starting 6-9", () => {
    expect(normalizeIndianMobile("9876543210")).toBe("9876543210");
  });

  it("accepts +91 and spaced formatting", () => {
    expect(normalizeIndianMobile("+91 98765 43210")).toBe("9876543210");
    expect(normalizeIndianMobile("91-9876543210")).toBe("9876543210");
  });

  it("rejects landlines and short numbers", () => {
    expect(normalizeIndianMobile("02832212345")).toBeNull();
    expect(normalizeIndianMobile("12345")).toBeNull();
    expect(normalizeIndianMobile("5876543210")).toBeNull();
  });
});

describe("validateWebsiteLead", () => {
  const valid = {
    name: "Asha Patel",
    phone: "9876543210",
    email: "asha@example.com",
    goal: "strength",
    interest: "early-access",
    message: "Looking forward to training in Bhuj.",
  };

  it("accepts a complete valid enquiry", () => {
    const result = validateWebsiteLead(valid);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.spam).toBe(false);
      expect(result.data.phone).toBe("9876543210");
      expect(result.data.email).toBe("asha@example.com");
    }
  });

  it("allows email to be omitted", () => {
    const result = validateWebsiteLead({ ...valid, email: "" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.email).toBeNull();
  });

  it("rejects a missing name and invalid phone", () => {
    const result = validateWebsiteLead({
      ...valid,
      name: " ",
      phone: "123",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.name).toBeTruthy();
      expect(result.fieldErrors.phone).toBeTruthy();
    }
  });

  it("rejects invented goals or interests", () => {
    const result = validateWebsiteLead({
      ...valid,
      goal: "zumba",
      interest: "sauna",
    });
    expect(result.ok).toBe(false);
  });

  it("marks honeypot submissions as spam without field errors", () => {
    const result = validateWebsiteLead({ ...valid, company: "http://spam.test" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.spam).toBe(true);
  });
});

describe("formatLeadNotes", () => {
  it("stores goal, interest, and message for the CRM", () => {
    const notes = formatLeadNotes({
      name: "Asha",
      phone: "9876543210",
      email: null,
      goal: "strength",
      interest: "early-access",
      message: "Please call in the evening.",
    });
    expect(notes).toContain("Goal: Strength");
    expect(notes).toContain("Interest: Early Access");
    expect(notes).toContain("Please call in the evening.");
  });
});

describe("mapSubmitLeadError", () => {
  it("maps rate limiting", () => {
    const result = mapSubmitLeadError("rate_limited");
    expect(result.kind).toBe("error");
    if (result.kind === "error") {
      expect(result.error).toContain("few minutes");
    }
  });

  it("maps invalid phone to a field error", () => {
    const result = mapSubmitLeadError("invalid_phone");
    expect(result.kind).toBe("error");
    if (result.kind === "error") {
      expect(result.fieldErrors?.phone).toBeTruthy();
    }
  });

  it("maps invalid name / email / goal / interest", () => {
    for (const msg of ["invalid_name", "invalid_email", "invalid_goal", "invalid_interest"]) {
      const result = mapSubmitLeadError(msg);
      expect(result.kind).toBe("error");
    }
  });

  it("signals the authenticated fallback when the RPC is missing", () => {
    expect(mapSubmitLeadError("Could not find the function").kind).toBe("fallback");
    expect(mapSubmitLeadError("schema cache").kind).toBe("fallback");
  });

  it("falls back to a generic error for unknown failures", () => {
    const result = mapSubmitLeadError("Failed to fetch");
    expect(result.kind).toBe("error");
    if (result.kind === "error") {
      expect(result.error).toContain("could not receive");
    }
  });
});
