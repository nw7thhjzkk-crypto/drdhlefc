import { describe, expect, it } from "vitest";
import { formatINR } from "./currency";

describe("formatINR", () => {
  it("formats integers without decimals", () => {
    expect(formatINR(0)).toBe("₹0");
    expect(formatINR(500)).toBe("₹500");
    expect(formatINR(1499)).toBe("₹1,499");
  });

  it("uses Indian lakh/crore digit grouping", () => {
    expect(formatINR(150000)).toBe("₹1,50,000");
    expect(formatINR(12345678)).toBe("₹1,23,45,678");
  });

  it("keeps two decimals for fractional amounts", () => {
    expect(formatINR(1499.5)).toBe("₹1,499.50");
    expect(formatINR(0.05)).toBe("₹0.05");
  });

  it("accepts numeric strings (Postgres numeric columns)", () => {
    expect(formatINR("2500")).toBe("₹2,500");
    expect(formatINR("1499.50")).toBe("₹1,499.50");
  });

  it("falls back to ₹0 for null, undefined, NaN, and junk", () => {
    expect(formatINR(null)).toBe("₹0");
    expect(formatINR(undefined)).toBe("₹0");
    expect(formatINR(Number.NaN)).toBe("₹0");
    expect(formatINR("not-a-number")).toBe("₹0");
  });

  it("formats negative amounts (refund-style displays)", () => {
    expect(formatINR(-250)).toBe("-₹250");
  });
});
