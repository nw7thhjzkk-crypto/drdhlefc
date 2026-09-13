import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { uploadToDrive } from "./googleDrive";

describe("uploadToDrive", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.GOOGLE_DRIVE_CLIENT_ID;
    delete process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    delete process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns null when GOOGLE_DRIVE_CLIENT_ID is not set", async () => {
    const result = await uploadToDrive(new File(["test"], "test.png", { type: "image/png" }));
    expect(result).toBeNull();
  });

  it("returns null when GOOGLE_DRIVE_CLIENT_SECRET is not set", async () => {
    process.env.GOOGLE_DRIVE_CLIENT_ID = "test-id";
    const result = await uploadToDrive(new File(["test"], "test.png", { type: "image/png" }));
    expect(result).toBeNull();
  });

  it("returns null when GOOGLE_DRIVE_REFRESH_TOKEN is not set", async () => {
    process.env.GOOGLE_DRIVE_CLIENT_ID = "test-id";
    process.env.GOOGLE_DRIVE_CLIENT_SECRET = "test-secret";
    const result = await uploadToDrive(new File(["test"], "test.png", { type: "image/png" }));
    expect(result).toBeNull();
  });

  it("returns null when all Drive env vars are missing", async () => {
    const result = await uploadToDrive(new File(["test"], "test.png", { type: "image/png" }));
    expect(result).toBeNull();
  });

  it("throws when all Drive env vars are set (integration not yet implemented)", async () => {
    process.env.GOOGLE_DRIVE_CLIENT_ID = "test-id";
    process.env.GOOGLE_DRIVE_CLIENT_SECRET = "test-secret";
    process.env.GOOGLE_DRIVE_REFRESH_TOKEN = "test-token";
    await expect(
      uploadToDrive(new File(["test"], "test.png", { type: "image/png" }))
    ).rejects.toThrow("Google Drive upload not yet implemented");
  });
});
