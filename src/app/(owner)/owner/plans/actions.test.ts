import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPlan } from './actions';
import { revalidatePath } from 'next/cache';

// Mock dependencies
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// We need to import the mocked module to change its return value
import { createClient } from '@/utils/supabase/server';

describe('createPlan', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      auth: {
        getSession: vi.fn(),
      },
      from: vi.fn(),
    };

    (createClient as any).mockResolvedValue(mockSupabase);
  });

  it('should successfully create a plan with user logged in', async () => {
    // Setup mocks
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'test-user-id' } } },
    });

    const mockInsertPlan = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 'new-plan-id' }, error: null }),
      }),
    });

    const mockInsertLog = vi.fn().mockResolvedValue({ error: null });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'membership_plans') {
        return { insert: mockInsertPlan };
      }
      if (table === 'audit_logs') {
        return { insert: mockInsertLog };
      }
      return {};
    });

    // Create FormData
    const formData = new FormData();
    formData.append('name', 'Test Plan');
    formData.append('duration_days', '30');
    formData.append('price', '99.99');
    formData.append('plan_type', 'gym');
    formData.append('description', 'Test Description');

    // Execute
    const result = await createPlan(formData);

    // Verify
    expect(result).toEqual({ success: true });

    expect(mockInsertPlan).toHaveBeenCalledWith({
      name: 'Test Plan',
      duration_days: 30,
      price: 99.99,
      plan_type: 'gym',
      description: 'Test Description',
      status: 'active',
    });

    expect(mockInsertLog).toHaveBeenCalledWith({
      actor_profile_id: 'test-user-id',
      action: 'create_plan',
      entity_type: 'membership_plan',
      entity_id: 'new-plan-id',
      details: { name: 'Test Plan', price: 99.99 },
    });

    expect(revalidatePath).toHaveBeenCalledWith('/owner/plans');
  });

  it('should successfully create a plan without user logged in', async () => {
    // Setup mocks - NO USER
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    });

    const mockInsertPlan = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 'new-plan-id' }, error: null }),
      }),
    });

    const mockInsertLog = vi.fn();

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'membership_plans') {
        return { insert: mockInsertPlan };
      }
      if (table === 'audit_logs') {
        return { insert: mockInsertLog };
      }
      return {};
    });

    // Create FormData
    const formData = new FormData();
    formData.append('name', 'Test Plan');
    formData.append('duration_days', '30');
    formData.append('price', '99.99');
    formData.append('plan_type', 'gym');
    formData.append('description', 'Test Description');

    // Execute
    const result = await createPlan(formData);

    // Verify
    expect(result).toEqual({ success: true });
    expect(mockInsertPlan).toHaveBeenCalled();
    expect(mockInsertLog).not.toHaveBeenCalled(); // Audit log should not be called
    expect(revalidatePath).toHaveBeenCalledWith('/owner/plans');
  });

  it('should return error if plan creation fails', async () => {
    // Setup mocks
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'test-user-id' } } },
    });

    const mockInsertPlan = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
      }),
    });

    const mockInsertLog = vi.fn();

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'membership_plans') {
        return { insert: mockInsertPlan };
      }
      if (table === 'audit_logs') {
        return { insert: mockInsertLog };
      }
      return {};
    });

    // Create FormData
    const formData = new FormData();
    formData.append('name', 'Test Plan');
    formData.append('duration_days', '30');
    formData.append('price', '99.99');
    formData.append('plan_type', 'gym');
    formData.append('description', 'Test Description');

    // Execute
    const result = await createPlan(formData);

    // Verify
    expect(result).toEqual({ error: 'Database error' });
    expect(mockInsertPlan).toHaveBeenCalled();
    expect(mockInsertLog).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
