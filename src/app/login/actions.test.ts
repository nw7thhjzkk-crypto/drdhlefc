import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { login } from "./actions";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("login action", () => {
  let mockSupabase: {
    auth: { signInWithPassword: Mock };
    from: Mock;
  };
  let mockSelect: Mock;
  let mockEq: Mock;
  let mockSingle: Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSingle = vi.fn();
    mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    mockSupabase = {
      auth: {
        signInWithPassword: vi.fn(),
      },
      from: vi.fn().mockReturnValue({ select: mockSelect }),
    };

    (createClient as unknown as Mock).mockResolvedValue(mockSupabase);
  });

  it("redirects to login with error if auth fails", async () => {
    const formData = new FormData();
    formData.append("email", "test@example.com");
    formData.append("password", "wrongpassword");

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      error: { message: "Invalid credentials" },
      data: { user: null },
    });

    // We catch the error if Next.js redirect throws in older versions,
    // or just let it pass if redirect is a standard mock.
    // In our mock, it's just a vi.fn() returning undefined.
    await login(formData);

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "wrongpassword",
    });
    expect(redirect).toHaveBeenCalledWith("/login?error=Invalid credentials");
  });

  it("redirects to owner dashboard if user is an owner", async () => {
    const formData = new FormData();
    formData.append("email", "owner@example.com");
    formData.append("password", "password123");

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      error: null,
      data: { user: { id: "user-123" } },
    });

    mockSingle.mockResolvedValue({
      data: { role: "owner" },
      error: null,
    });

    await login(formData);

    expect(mockSupabase.from).toHaveBeenCalledWith("profiles");
    expect(mockSelect).toHaveBeenCalledWith("role");
    expect(mockEq).toHaveBeenCalledWith("id", "user-123");
    expect(redirect).toHaveBeenCalledWith("/owner/dashboard");
  });

  it("redirects to trainer dashboard if user is a trainer", async () => {
    const formData = new FormData();
    formData.append("email", "trainer@example.com");
    formData.append("password", "password123");

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      error: null,
      data: { user: { id: "user-456" } },
    });

    mockSingle.mockResolvedValue({
      data: { role: "trainer" },
      error: null,
    });

    await login(formData);

    expect(redirect).toHaveBeenCalledWith("/trainer/dashboard");
  });

  it("redirects to member home if user is a member", async () => {
    const formData = new FormData();
    formData.append("email", "member@example.com");
    formData.append("password", "password123");

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      error: null,
      data: { user: { id: "user-789" } },
    });

    mockSingle.mockResolvedValue({
      data: { role: "member" },
      error: null,
    });

    await login(formData);

    expect(redirect).toHaveBeenCalledWith("/member/home");
  });

  it("redirects to / and calls revalidatePath if role is unknown", async () => {
    const formData = new FormData();
    formData.append("email", "unknown@example.com");
    formData.append("password", "password123");

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      error: null,
      data: { user: { id: "user-000" } },
    });

    mockSingle.mockResolvedValue({
      data: { role: "unknown_role" },
      error: null,
    });

    await login(formData);

    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("redirects to / and calls revalidatePath if profile fetching errors", async () => {
    const formData = new FormData();
    formData.append("email", "error@example.com");
    formData.append("password", "password123");

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      error: null,
      data: { user: { id: "user-error" } },
    });

    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "Failed to fetch profile" },
    });

    await login(formData);

    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("redirects to / and calls revalidatePath if authData has no user", async () => {
    const formData = new FormData();
    formData.append("email", "nouser@example.com");
    formData.append("password", "password123");

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      error: null,
      data: { user: null },
    });

    await login(formData);

    expect(mockSupabase.from).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(redirect).toHaveBeenCalledWith("/");
  });
});
