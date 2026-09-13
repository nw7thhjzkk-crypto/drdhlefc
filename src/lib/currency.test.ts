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

  it("formats large round numbers without trailing decimals", () => {
    expect(formatINR(100000)).toBe("₹1,00,000");
    expect(formatINR(1000000)).toBe("₹10,00,000");
    expect(formatINR(10000000)).toBe("₹1,00,00,000");
  });

  it("rounds fractional amounts to two decimal places", () => {
    expect(formatINR(1999.999)).toBe("₹2,000.00");
    expect(formatINR(0.001)).toBe("₹0.00");
    expect(formatINR(10.555)).toBe("₹10.56");
  });

  it("formats the value 1 correctly (boundary)", () => {
    expect(formatINR(1)).toBe("₹1");
    expect(formatINR(-1)).toBe("-₹1");
  });

  it("handles empty string as ₹0", () => {
    expect(formatINR("")).toBe("₹0");
  });

  it("handles string '0' and '0.00'", () => {
    expect(formatINR("0")).toBe("₹0");
    expect(formatINR("0.00")).toBe("₹0");
  });

  it("handles Infinity and -Infinity gracefully", () => {
    const result = formatINR(Infinity);
    expect(result).toContain("₹");
    const negResult = formatINR(-Infinity);
    expect(negResult).toContain("₹");
  });

  it("handles very small fractional values", () => {
    expect(formatINR(0.1)).toBe("₹0.10");
    expect(formatINR(0.01)).toBe("₹0.01");
  });

  it("preserves negative sign for fractional amounts", () => {
    expect(formatINR(-1499.5)).toBe("-₹1,499.50");
    expect(formatINR(-0.5)).toBe("-₹0.50");
  });
});
