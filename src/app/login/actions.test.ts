import { describe, it, expect, vi, beforeEach } from "vitest";
import { login } from "./actions";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    const err = new Error(`REDIRECT:${url}`);
    throw err;
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  })),
}));

import { redirect } from "next/navigation";

describe("login action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeFormData(entries: Record<string, string>) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(entries)) fd.append(k, v);
    return fd;
  }

  it("redirects to /demo when the demo password BIKHU7 is entered", async () => {
    const formData = makeFormData({ password: "BIKHU7", email: "" });
    await expect(login(formData)).rejects.toThrow("REDIRECT:/demo");
    expect(redirect).toHaveBeenCalledWith("/demo");
  });

  it("does not call Supabase when demo password is used", async () => {
    const { createClient } = await import("@/utils/supabase/server");
    const formData = makeFormData({ password: "BIKHU7", email: "test@test.com" });
    await expect(login(formData)).rejects.toThrow("REDIRECT:/demo");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("rejects an incorrect password by calling Supabase and redirecting to error", async () => {
    const signInMock = vi.fn().mockResolvedValue({
      error: { message: "Invalid credentials" },
      data: { user: null },
    });
    const { createClient } = await import("@/utils/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: { signInWithPassword: signInMock },
      from: vi.fn().mockReturnThis(),
    } as never);

    const formData = makeFormData({ password: "wrongpassword", email: "user@test.com" });
    await expect(login(formData)).rejects.toThrow("REDIRECT:/login?error=Invalid credentials");
    expect(signInMock).toHaveBeenCalledWith({ email: "user@test.com", password: "wrongpassword" });
  });
});
