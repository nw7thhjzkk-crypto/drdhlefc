import { describe, it, expect } from "vitest";
import {
  TRAINING_PILLARS,
  EXPERIENCE_STEPS,
  EXPECTATIONS,
  MEMBERSHIP_PILLARS,
  ACTIVITIES,
  TRAINER_PROFILES,
  FACILITY_HIGHLIGHTS,
  SPACE_ZONES,
  AMENITIES,
  FAQ_ITEMS,
} from "./public-content";

describe("TRAINING_PILLARS", () => {
  it("is a non-empty array with title and body", () => {
    expect(Array.isArray(TRAINING_PILLARS)).toBe(true);
    expect(TRAINING_PILLARS.length).toBeGreaterThan(0);
    for (const pillar of TRAINING_PILLARS) {
      expect(typeof pillar.title).toBe("string");
      expect(typeof pillar.body).toBe("string");
      expect(pillar.title.length).toBeGreaterThan(0);
      expect(pillar.body.length).toBeGreaterThan(0);
    }
  });

  it("includes known pillar titles", () => {
    const titles = TRAINING_PILLARS.map((p) => p.title);
    expect(titles).toContain("Strength");
    expect(titles).toContain("Free weights");
    expect(titles).toContain("Cardio");
    expect(titles).toContain("Personal training");
  });

  it("has unique titles", () => {
    const titles = TRAINING_PILLARS.map((p) => p.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe("EXPERIENCE_STEPS", () => {
  it("is a non-empty array with title and body", () => {
    expect(Array.isArray(EXPERIENCE_STEPS)).toBe(true);
    expect(EXPERIENCE_STEPS.length).toBeGreaterThan(0);
    for (const step of EXPERIENCE_STEPS) {
      expect(typeof step.title).toBe("string");
      expect(typeof step.body).toBe("string");
      expect(step.title.length).toBeGreaterThan(0);
    }
  });

  it("includes Assessment and Results steps", () => {
    const titles = EXPERIENCE_STEPS.map((s) => s.title);
    expect(titles).toContain("Assessment");
    expect(titles).toContain("Results");
  });
});

describe("EXPECTATIONS", () => {
  it("is a non-empty array with title and body", () => {
    expect(Array.isArray(EXPECTATIONS)).toBe(true);
    expect(EXPECTATIONS.length).toBeGreaterThan(0);
    for (const exp of EXPECTATIONS) {
      expect(typeof exp.title).toBe("string");
      expect(typeof exp.body).toBe("string");
      expect(exp.title.length).toBeGreaterThan(0);
      expect(exp.body.length).toBeGreaterThan(0);
    }
  });
});

describe("MEMBERSHIP_PILLARS", () => {
  it("is a non-empty array with title and body", () => {
    expect(Array.isArray(MEMBERSHIP_PILLARS)).toBe(true);
    expect(MEMBERSHIP_PILLARS.length).toBeGreaterThan(0);
    for (const pillar of MEMBERSHIP_PILLARS) {
      expect(typeof pillar.title).toBe("string");
      expect(typeof pillar.body).toBe("string");
      expect(pillar.title.length).toBeGreaterThan(0);
      expect(pillar.body.length).toBeGreaterThan(0);
    }
  });

  it("has unique titles", () => {
    const titles = MEMBERSHIP_PILLARS.map((p) => p.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe("ACTIVITIES", () => {
  it("is initially an empty array (awaiting real data)", () => {
    expect(Array.isArray(ACTIVITIES)).toBe(true);
    expect(ACTIVITIES).toHaveLength(0);
  });
});

describe("TRAINER_PROFILES", () => {
  it("is initially an empty array (awaiting real data)", () => {
    expect(Array.isArray(TRAINER_PROFILES)).toBe(true);
    expect(TRAINER_PROFILES).toHaveLength(0);
  });
});

describe("FACILITY_HIGHLIGHTS", () => {
  it("is initially an empty array (awaiting real data)", () => {
    expect(Array.isArray(FACILITY_HIGHLIGHTS)).toBe(true);
    expect(FACILITY_HIGHLIGHTS).toHaveLength(0);
  });
});

describe("SPACE_ZONES", () => {
  it("is a non-empty array with id, title, and body", () => {
    expect(Array.isArray(SPACE_ZONES)).toBe(true);
    expect(SPACE_ZONES.length).toBeGreaterThan(0);
    for (const zone of SPACE_ZONES) {
      expect(typeof zone.id).toBe("string");
      expect(typeof zone.title).toBe("string");
      expect(typeof zone.body).toBe("string");
      expect(zone.id.length).toBeGreaterThan(0);
      expect(zone.title.length).toBeGreaterThan(0);
      expect(zone.body.length).toBeGreaterThan(0);
    }
  });

  it("has unique ids", () => {
    const ids = SPACE_ZONES.map((z) => z.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes known zone ids", () => {
    const ids = SPACE_ZONES.map((z) => z.id);
    expect(ids).toContain("floor");
    expect(ids).toContain("strength");
    expect(ids).toContain("cardio");
    expect(ids).toContain("steam");
  });
});

describe("AMENITIES", () => {
  it("is a non-empty array with id, zone, title, and body", () => {
    expect(Array.isArray(AMENITIES)).toBe(true);
    expect(AMENITIES.length).toBeGreaterThan(0);
    for (const amenity of AMENITIES) {
      expect(typeof amenity.id).toBe("string");
      expect(typeof amenity.zone).toBe("string");
      expect(typeof amenity.title).toBe("string");
      expect(typeof amenity.body).toBe("string");
      expect(amenity.id.length).toBeGreaterThan(0);
      expect(amenity.zone.length).toBeGreaterThan(0);
    }
  });

  it("has unique ids", () => {
    const ids = AMENITIES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("amenities belong to valid zones", () => {
    const validZones = new Set(["Train", "Coach", "After", "Support"]);
    for (const amenity of AMENITIES) {
      expect(validZones).toContain(amenity.zone);
    }
  });
});

describe("FAQ_ITEMS", () => {
  it("is a non-empty array with q and a", () => {
    expect(Array.isArray(FAQ_ITEMS)).toBe(true);
    expect(FAQ_ITEMS.length).toBeGreaterThan(0);
    for (const item of FAQ_ITEMS) {
      expect(typeof item.q).toBe("string");
      expect(typeof item.a).toBe("string");
      expect(item.q.length).toBeGreaterThan(0);
      expect(item.a.length).toBeGreaterThan(0);
    }
  });

  it("contains a location FAQ", () => {
    const locationQ = FAQ_ITEMS.find((item) => item.q.includes("located"));
    expect(locationQ).toBeDefined();
    expect(locationQ!.a).toContain("Bhuj");
  });

  it("contains a contact FAQ", () => {
    const contactQ = FAQ_ITEMS.find((item) => item.q.includes("contact"));
    expect(contactQ).toBeDefined();
    expect(contactQ!.a).toContain("drdhlefc@gmail.com");
  });
});
