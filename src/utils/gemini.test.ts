import { describe, it, expect } from "vitest";
import { getGeminiInsights } from "./gemini";

describe("getGeminiInsights", () => {
  it("returns AI Insight Stub", async () => {
    const result = await getGeminiInsights("test prompt");
    expect(result).toBe("AI Insight Stub");
  });
});
