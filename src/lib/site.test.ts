import { describe, it, expect, afterEach, beforeEach } from "vitest";
import {
  site,
  LAUNCH_STATUS,
  LAUNCH_TEXT,
  FITNESS_GOALS,
  INTERESTS,
  GALLERY_SLOTS,
  siteOrigin,
  formattedAddress,
} from "./site";

describe("site constants", () => {
  it("LAUNCH_STATUS is PRE_LAUNCH", () => {
    expect(LAUNCH_STATUS).toBe("PRE_LAUNCH");
  });

  it("LAUNCH_TEXT is Coming Soon", () => {
    expect(LAUNCH_TEXT).toBe("Coming Soon");
  });

  it("site has required fields", () => {
    expect(site.name).toBe("Dr DHL Elite Fitness Club");
    expect(site.shortName).toBe("Dr DHL");
    expect(site.tagline).toBeTruthy();
    expect(site.email).toBeTruthy();
    expect(site.instagramHandle).toBe("DRDHLEFC");
    expect(site.instagramUrl).toContain("instagram.com");
  });

  it("site.launchStatus matches LAUNCH_STATUS", () => {
    expect(site.launchStatus).toBe(LAUNCH_STATUS);
  });

  it("site.launchText matches LAUNCH_TEXT", () => {
    expect(site.launchText).toBe(LAUNCH_TEXT);
  });

  it("site.address has correct structure", () => {
    expect(Array.isArray(site.address.lines)).toBe(true);
    expect(site.address.lines.length).toBeGreaterThan(0);
    expect(site.address.country).toBe("IN");
    expect(site.address.postalCode).toBe("370001");
    expect(site.address.locality).toBe("Bhuj");
    expect(site.address.region).toBe("Gujarat");
  });

  it("site.brand has logo paths", () => {
    expect(site.brand.fullLogo).toBeTruthy();
    expect(site.brand.monogram).toBeTruthy();
  });

  it("null fields remain null (phone, whatsapp, facebookUrl)", () => {
    expect(site.phone).toBeNull();
    expect(site.whatsapp).toBeNull();
    expect(site.facebookUrl).toBeNull();
  });

  it("openingDate and openingMonth are null before launch", () => {
    expect(site.openingDate).toBeNull();
    expect(site.openingMonth).toBeNull();
  });

  it("mapsSearchUrl contains Bhuj address", () => {
    expect(site.mapsSearchUrl).toContain("Bhuj");
    expect(site.mapsSearchUrl).toContain("maps");
  });
});

describe("FITNESS_GOALS", () => {
  it("is a non-empty array of goal objects", () => {
    expect(Array.isArray(FITNESS_GOALS)).toBe(true);
    expect(FITNESS_GOALS.length).toBeGreaterThan(0);
  });

  it("every goal has a value and label", () => {
    for (const goal of FITNESS_GOALS) {
      expect(typeof goal.value).toBe("string");
      expect(typeof goal.label).toBe("string");
      expect(goal.value.length).toBeGreaterThan(0);
      expect(goal.label.length).toBeGreaterThan(0);
    }
  });

  it("includes known goals", () => {
    const values = FITNESS_GOALS.map((g) => g.value);
    expect(values).toContain("weight-loss");
    expect(values).toContain("muscle-gain");
    expect(values).toContain("general-fitness");
    expect(values).toContain("strength");
    expect(values).toContain("endurance");
    expect(values).toContain("other");
  });

  it("has unique values", () => {
    const values = FITNESS_GOALS.map((g) => g.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("INTERESTS", () => {
  it("is a non-empty array of interest objects", () => {
    expect(Array.isArray(INTERESTS)).toBe(true);
    expect(INTERESTS.length).toBeGreaterThan(0);
  });

  it("every interest has a value and label", () => {
    for (const interest of INTERESTS) {
      expect(typeof interest.value).toBe("string");
      expect(typeof interest.label).toBe("string");
      expect(interest.value.length).toBeGreaterThan(0);
    }
  });

  it("includes known interests", () => {
    const values = INTERESTS.map((i) => i.value);
    expect(values).toContain("early-access");
    expect(values).toContain("membership");
    expect(values).toContain("personal-training");
    expect(values).toContain("general");
  });

  it("has unique values", () => {
    const values = INTERESTS.map((i) => i.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("GALLERY_SLOTS", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(GALLERY_SLOTS)).toBe(true);
    expect(GALLERY_SLOTS.length).toBeGreaterThan(0);
  });

  it("every slot has an id and label", () => {
    for (const slot of GALLERY_SLOTS) {
      expect(typeof slot.id).toBe("string");
      expect(typeof slot.label).toBe("string");
      expect(slot.id.length).toBeGreaterThan(0);
      expect(slot.label.length).toBeGreaterThan(0);
    }
  });

  it("every slot has a non-empty src URL", () => {
    for (const slot of GALLERY_SLOTS) {
      expect(slot.src).toBeTruthy();
      expect(slot.src).toMatch(/^https?:\/\//);
    }
  });

  it("has unique ids", () => {
    const ids = GALLERY_SLOTS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("formattedAddress", () => {
  it("joins address lines with newline by default", () => {
    const result = formattedAddress();
    expect(result).toContain("Shop No. 201–204");
    expect(result).toContain("Bhuj, Gujarat");
    expect(result.split("\n").length).toBe(site.address.lines.length);
  });

  it("joins address lines with custom separator", () => {
    const result = formattedAddress(", ");
    expect(result).toContain("Shop No. 201–204, Bhagwati Heritage");
    expect(result).toContain("Near Sanskar Nagar");
    expect(result).toContain("India – 370001");
  });

  it("includes postal code in the address", () => {
    const result = formattedAddress(", ");
    expect(result).toContain("370001");
  });
});

describe("siteOrigin", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns NEXT_PUBLIC_SITE_URL when set", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://drdhlefc.com/";
    expect(siteOrigin()).toBe("https://drdhlefc.com");
  });

  it("strips trailing slash from NEXT_PUBLIC_SITE_URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com/";
    expect(siteOrigin()).toBe("https://example.com");
  });

  it("returns Vercel URL when NEXT_PUBLIC_SITE_URL is not set", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "https://drdhlefc.vercel.app";
    expect(siteOrigin()).toBe("https://drdhlefc.vercel.app");
  });

  it("strips protocol from Vercel URL", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "http://drdhlefc.vercel.app";
    expect(siteOrigin()).toBe("https://drdhlefc.vercel.app");
  });

  it("falls back to localhost when no env vars are set", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    expect(siteOrigin()).toBe("http://localhost:3000");
  });

  it("prefers NEXT_PUBLIC_SITE_URL over Vercel", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://custom.com";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "https://vercel.app";
    expect(siteOrigin()).toBe("https://custom.com");
  });
});
