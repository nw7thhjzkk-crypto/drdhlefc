import { describe, it, expect, vi, beforeEach } from "vitest";
import { resetPassword } from "./actions";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
      updateUser: vi.fn(),
    },
    rpc: vi.fn(),
  })),
}));

function makeFormData(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.append(k, v);
  return fd;
}

describe("resetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when new password is empty", async () => {
    const formData = makeFormData({
      new_password: "",
      confirm_password: "",
    });
    const result = await resetPassword(null, formData);
    expect(result).toEqual({ ok: false, error: "New password is required" });
  });

  it("returns error when passwords do not match", async () => {
    const formData = makeFormData({
      new_password: "Password1",
      confirm_password: "Password2",
    });
    const result = await resetPassword(null, formData);
    expect(result).toEqual({ ok: false, error: "Passwords do not match" });
  });

  it("returns error when password is too short", async () => {
    const formData = makeFormData({
      new_password: "Ab1",
      confirm_password: "Ab1",
    });
    const result = await resetPassword(null, formData);
    expect(result).toEqual({
      ok: false,
      error: "Password must be at least 8 characters",
    });
  });

  it("returns error when password lacks uppercase", async () => {
    const formData = makeFormData({
      new_password: "lowercase1",
      confirm_password: "lowercase1",
    });
    const result = await resetPassword(null, formData);
    expect(result).toEqual({
      ok: false,
      error: "Password must contain an uppercase letter",
    });
  });

  it("returns error when password lacks lowercase", async () => {
    const formData = makeFormData({
      new_password: "UPPERCASE1",
      confirm_password: "UPPERCASE1",
    });
    const result = await resetPassword(null, formData);
    expect(result).toEqual({
      ok: false,
      error: "Password must contain a lowercase letter",
    });
  });

  it("returns error when password lacks number", async () => {
    const formData = makeFormData({
      new_password: "NoNumberHere",
      confirm_password: "NoNumberHere",
    });
    const result = await resetPassword(null, formData);
    expect(result).toEqual({
      ok: false,
      error: "Password must contain at least one number",
    });
  });

  it("returns error when user session is not available", async () => {
    const getUserMock = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated" },
    });
    const { createClient } = await import("@/utils/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: getUserMock, updateUser: vi.fn() },
      rpc: vi.fn(),
    } as never);

    const formData = makeFormData({
      new_password: "ValidPass1",
      confirm_password: "ValidPass1",
    });
    const result = await resetPassword(null, formData);

    expect(result).toEqual({
      ok: false,
      error: "Session expired. Please request a new reset link.",
    });
  });

  it("calls updateUser with new password on valid input", async () => {
    const updateUserMock = vi.fn().mockResolvedValue({ error: null });
    const getUserMock = vi.fn().mockResolvedValue({
      data: { user: { id: "user-123", email: "test@test.com" } },
      error: null,
    });
    const rpcMock = vi.fn().mockResolvedValue({ error: null });
    const { createClient } = await import("@/utils/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: getUserMock, updateUser: updateUserMock },
      rpc: rpcMock,
    } as never);

    const formData = makeFormData({
      new_password: "NewPass123",
      confirm_password: "NewPass123",
    });
    const result = await resetPassword(null, formData);

    expect(updateUserMock).toHaveBeenCalledWith({ password: "NewPass123" });
    expect(result).toEqual({ ok: true });
  });

  it("audit logs the password reset", async () => {
    const updateUserMock = vi.fn().mockResolvedValue({ error: null });
    const getUserMock = vi.fn().mockResolvedValue({
      data: { user: { id: "user-123", email: "test@test.com" } },
      error: null,
    });
    const rpcMock = vi.fn().mockResolvedValue({ error: null });
    const { createClient } = await import("@/utils/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: getUserMock, updateUser: updateUserMock },
      rpc: rpcMock,
    } as never);

    const formData = makeFormData({
      new_password: "NewPass123",
      confirm_password: "NewPass123",
    });
    await resetPassword(null, formData);

    expect(rpcMock).toHaveBeenCalledWith("insert_audit_log", {
      p_action: "MEMBER_PASSWORD_RESET",
      p_entity_type: "member",
      p_entity_id: "user-123",
      p_details: {},
    });
  });

  it("returns error when updateUser fails", async () => {
    const updateUserMock = vi.fn().mockResolvedValue({
      error: { message: "Password update failed" },
    });
    const getUserMock = vi.fn().mockResolvedValue({
      data: { user: { id: "user-123", email: "test@test.com" } },
      error: null,
    });
    const { createClient } = await import("@/utils/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: getUserMock, updateUser: updateUserMock },
      rpc: vi.fn(),
    } as never);

    const formData = makeFormData({
      new_password: "NewPass123",
      confirm_password: "NewPass123",
    });
    const result = await resetPassword(null, formData);

    expect(result).toEqual({
      ok: false,
      error: "Password update failed",
    });
  });
});
