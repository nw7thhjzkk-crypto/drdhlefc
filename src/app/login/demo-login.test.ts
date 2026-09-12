import { describe, it, expect } from "vitest";
import { DEMO_PASSWORD } from "@/lib/demo-data";

describe("login demo mode", () => {
  it("DEMO_PASSWORD is exported from demo-data", () => {
    expect(DEMO_PASSWORD).toBeDefined();
    expect(typeof DEMO_PASSWORD).toBe("string");
  });

  it("DEMO_PASSWORD has a reasonable length", () => {
    expect(DEMO_PASSWORD.length).toBeGreaterThanOrEqual(4);
  });

  it("DEMO_PASSWORD is the expected value", () => {
    expect(DEMO_PASSWORD).toBe("BIKHU7");
  });
});
