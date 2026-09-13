import { describe, it, expect, beforeEach } from "vitest";
import { isProtectedPath, updateSession } from "./middleware";

describe("isProtectedPath", () => {
  it("returns true for /owner routes", () => {
    expect(isProtectedPath("/owner")).toBe(true);
    expect(isProtectedPath("/owner/dashboard")).toBe(true);
    expect(isProtectedPath("/owner/members")).toBe(true);
    expect(isProtectedPath("/owner/settings")).toBe(true);
  });

  it("returns true for /trainer routes", () => {
    expect(isProtectedPath("/trainer")).toBe(true);
    expect(isProtectedPath("/trainer/dashboard")).toBe(true);
    expect(isProtectedPath("/trainer/members")).toBe(true);
  });

  it("returns true for /member routes", () => {
    expect(isProtectedPath("/member")).toBe(true);
    expect(isProtectedPath("/member/home")).toBe(true);
    expect(isProtectedPath("/member/progress")).toBe(true);
  });

  it("returns false for public routes", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/login")).toBe(false);
    expect(isProtectedPath("/demo")).toBe(false);
    expect(isProtectedPath("/about")).toBe(false);
    expect(isProtectedPath("/contact")).toBe(false);
  });

  it("returns false for paths that merely contain the prefix as a substring", () => {
    expect(isProtectedPath("/not-owner")).toBe(false);
    expect(isProtectedPath("/pre-member")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isProtectedPath("")).toBe(false);
  });

  it("handles paths with query strings and fragments", () => {
    expect(isProtectedPath("/owner?tab=settings")).toBe(true);
    expect(isProtectedPath("/trainer#section")).toBe(true);
  });
});

describe("updateSession — Supabase not configured", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  function makeRequest(pathname: string) {
    let currentPath = pathname;
    const clonedUrl = {
      get pathname() {
        return currentPath;
      },
      set pathname(val: string) {
        currentPath = val;
      },
      toString() {
        return `http://localhost${currentPath}`;
      },
    };
    return {
      nextUrl: {
        get pathname() {
          return currentPath;
        },
        clone() {
          return clonedUrl;
        },
      },
      cookies: { getAll: () => [] },
    } as unknown as Parameters<typeof updateSession>[0];
  }

  it("redirects protected paths to /login when Supabase env is missing", async () => {
    const request = makeRequest("/owner/dashboard");
    const result = await updateSession(request);
    expect(result.status).toBeGreaterThanOrEqual(300);
    expect(result.status).toBeLessThan(400);
    expect(result.headers.get("location")).toContain("/login");
  });

  it("allows public paths through when Supabase env is missing", async () => {
    const request = makeRequest("/demo");
    const result = await updateSession(request);
    expect(result).toHaveProperty("status", 200);
  });

  it("allows /login through when Supabase env is missing", async () => {
    const request = makeRequest("/login");
    const result = await updateSession(request);
    expect(result).toHaveProperty("status", 200);
  });
});
