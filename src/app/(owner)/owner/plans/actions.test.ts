import { vi, describe, it, expect, beforeEach } from "vitest";
import { createPlan } from "./actions";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("createPlan", () => {
  let mockMembershipPlanInsert: ReturnType<typeof vi.fn>;
  let mockAuditLogInsert: ReturnType<typeof vi.fn>;
  let mockSelect: ReturnType<typeof vi.fn>;
  let mockSingle: ReturnType<typeof vi.fn>;
  let mockGetSession: ReturnType<typeof vi.fn>;
  let mockFrom: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSingle = vi.fn().mockResolvedValue({ data: { id: "plan-123" }, error: null });
    mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    mockMembershipPlanInsert = vi.fn().mockReturnValue({ select: mockSelect });
    mockAuditLogInsert = vi.fn().mockResolvedValue({ error: null });

    mockGetSession = vi.fn().mockResolvedValue({
      data: { session: { user: { id: "user-123" } } },
    });

    mockFrom = vi.fn((table: string) => {
      if (table === "membership_plans") {
        return { insert: mockMembershipPlanInsert };
      }
      if (table === "audit_logs") {
        return { insert: mockAuditLogInsert };
      }
      return {};
    });

    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: { getSession: mockGetSession },
      from: mockFrom,
    });
  });

  const createFormData = () => {
    const formData = new FormData();
    formData.append("name", "Basic Plan");
    formData.append("duration_days", "30");
    formData.append("price", "49.99");
    formData.append("plan_type", "monthly");
    formData.append("description", "Basic membership");
    return formData;
  };

  it("successfully creates a plan and audit log when user is authenticated", async () => {
    const formData = createFormData();
    const result = await createPlan(formData);

    expect(mockGetSession).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith("membership_plans");
    expect(mockMembershipPlanInsert).toHaveBeenCalledWith({
      name: "Basic Plan",
      duration_days: 30,
      price: 49.99,
      plan_type: "monthly",
      description: "Basic membership",
      status: "active"
    });

    expect(mockFrom).toHaveBeenCalledWith("audit_logs");
    expect(mockAuditLogInsert).toHaveBeenCalledWith({
      actor_profile_id: "user-123",
      action: "create_plan",
      entity_type: "membership_plan",
      entity_id: "plan-123",
      details: { name: "Basic Plan", price: 49.99 }
    });

    expect(revalidatePath).toHaveBeenCalledWith("/owner/plans");
    expect(result).toEqual({ success: true });
  });

  it("successfully creates a plan without audit log when user is not authenticated", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
    });

    const formData = createFormData();
    const result = await createPlan(formData);

    expect(mockMembershipPlanInsert).toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalledWith("audit_logs");
    expect(mockAuditLogInsert).not.toHaveBeenCalled();

    expect(revalidatePath).toHaveBeenCalledWith("/owner/plans");
    expect(result).toEqual({ success: true });
  });

  it("returns error if inserting membership plan fails", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: "Database error" } });

    const formData = createFormData();
    const result = await createPlan(formData);

    expect(mockMembershipPlanInsert).toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalledWith("audit_logs");
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "Database error" });
  });
});
