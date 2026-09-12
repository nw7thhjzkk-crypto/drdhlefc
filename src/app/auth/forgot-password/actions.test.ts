import { describe, it, expect, vi, beforeEach } from "vitest";
import { requestPasswordReset } from "./actions";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      resetPasswordForEmail: vi.fn(),
    },
  })),
}));

function makeFormData(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.append(k, v);
  return fd;
}

describe("requestPasswordReset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when email is empty", async () => {
    const formData = makeFormData({ email: "" });
    const result = await requestPasswordReset(null, formData);
    expect(result).toEqual({ ok: false, error: "Email is required" });
  });

  it("returns error when email is whitespace only", async () => {
    const formData = makeFormData({ email: "   " });
    const result = await requestPasswordReset(null, formData);
    expect(result).toEqual({ ok: false, error: "Email is required" });
  });

  it("calls resetPasswordForEmail with the email and redirect URL", async () => {
    const resetMock = vi.fn().mockResolvedValue({ error: null });
    const { createClient } = await import("@/utils/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: { resetPasswordForEmail: resetMock },
    } as never);

    const formData = makeFormData({ email: "test@example.com" });
    const result = await requestPasswordReset(null, formData);

    expect(resetMock).toHaveBeenCalledTimes(1);
    const [email, options] = resetMock.mock.calls[0];
    expect(email).toBe("test@example.com");
    expect(options.redirectTo).toContain("/auth/reset-password");
    expect(result).toEqual({ ok: true });
  });

  it("trims whitespace from email", async () => {
    const resetMock = vi.fn().mockResolvedValue({ error: null });
    const { createClient } = await import("@/utils/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: { resetPasswordForEmail: resetMock },
    } as never);

    const formData = makeFormData({ email: "  test@example.com  " });
    await requestPasswordReset(null, formData);

    expect(resetMock).toHaveBeenCalledWith(
      "test@example.com",
      expect.any(Object),
    );
  });

  it("returns error when Supabase returns an error", async () => {
    const resetMock = vi.fn().mockResolvedValue({
      error: { message: "Email not found" },
    });
    const { createClient } = await import("@/utils/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: { resetPasswordForEmail: resetMock },
    } as never);

    const formData = makeFormData({ email: "unknown@test.com" });
    const result = await requestPasswordReset(null, formData);

    expect(result).toEqual({ ok: false, error: "Email not found" });
  });

  it("returns ok:true even for non-existent email (prevents enumeration)", async () => {
    const resetMock = vi.fn().mockResolvedValue({ error: null });
    const { createClient } = await import("@/utils/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: { resetPasswordForEmail: resetMock },
    } as never);

    const formData = makeFormData({ email: "nobody@test.com" });
    const result = await requestPasswordReset(null, formData);

    expect(result).toEqual({ ok: true });
  });
});
