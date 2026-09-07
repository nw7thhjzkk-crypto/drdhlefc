import { describe, it, expect } from "vitest";
import { calculateBMI } from "./bmi";

describe("calculateBMI", () => {
  it("calculates normal BMI rounded to 1 decimal", () => {
    // 70kg / (1.75m * 1.75m) = 22.857... -> 22.9
    expect(calculateBMI(175, 70)).toBe(22.9);
  });

  it("returns null for null height or weight", () => {
    expect(calculateBMI(null, 70)).toBeNull();
    expect(calculateBMI(175, null)).toBeNull();
    expect(calculateBMI(null, null)).toBeNull();
  });

  it("returns null for zero height", () => {
    expect(calculateBMI(0, 70)).toBeNull();
  });

  it("returns null for negative height", () => {
    expect(calculateBMI(-150, 70)).toBeNull();
  });

  it("returns null for zero weight", () => {
    expect(calculateBMI(175, 0)).toBeNull();
  });
});
