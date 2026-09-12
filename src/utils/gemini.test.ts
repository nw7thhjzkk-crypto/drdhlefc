import { describe, it, expect, afterEach } from "vitest";
import { getGeminiInsights } from "./gemini";

describe("getGeminiInsights", () => {
  const originalEnv = process.env.GEMINI_API_KEY;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalEnv;
    }
  });

  it("returns null when GEMINI_API_KEY is not set", async () => {
    delete process.env.GEMINI_API_KEY;
    const result = await getGeminiInsights("test prompt");
    expect(result).toBeNull();
  });

  it("throws when GEMINI_API_KEY is set (integration not implemented)", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    await expect(getGeminiInsights("test prompt")).rejects.toThrow(
      "Gemini integration not yet implemented"
    );
  });
});
