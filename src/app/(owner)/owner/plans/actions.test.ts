import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updatePlan } from './actions';
import { revalidatePath } from 'next/cache';

// Mock dependencies
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock Supabase Chain
const mockUpdateEq = vi.fn();
const mockInsert = vi.fn();

const mockSupabase = {
  auth: {
    getSession: vi.fn(),
  },
  from: vi.fn((table: string) => {
    if (table === 'membership_plans') {
      return {
        update: vi.fn(() => ({
          eq: mockUpdateEq,
        })),
      };
    }
    if (table === 'audit_logs') {
      return {
        insert: mockInsert,
      };
    }
    return {};
  }),
};

import { createClient } from '@/utils/supabase/server';

describe('updatePlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (createClient as any).mockResolvedValue(mockSupabase);
  });

  const getFormData = () => {
    const formData = new FormData();
    formData.append('name', 'Premium Plan');
    formData.append('duration_days', '30');
    formData.append('price', '99.99');
    formData.append('plan_type', 'gym');
    formData.append('description', 'Premium access');
    formData.append('status', 'active');
    return formData;
  };

  it('successfully updates a plan and inserts an audit log for an authenticated user', async () => {
    const mockUserId = 'user-123';
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: mockUserId } } },
    });

    mockUpdateEq.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ error: null });

    const formData = getFormData();
    const result = await updatePlan('plan-1', formData);

    expect(result).toEqual({ success: true });
    expect(mockSupabase.from).toHaveBeenCalledWith('membership_plans');
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'plan-1');

    // Audit log should be inserted
    expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
    expect(mockInsert).toHaveBeenCalledWith({
      actor_profile_id: mockUserId,
      action: 'update_plan',
      entity_type: 'membership_plan',
      entity_id: 'plan-1',
      details: { name: 'Premium Plan', status: 'active' },
    });

    expect(revalidatePath).toHaveBeenCalledWith('/owner/plans');
  });

  it('successfully updates a plan but skips audit log if no user session is present', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    });

    mockUpdateEq.mockResolvedValue({ error: null });

    const formData = getFormData();
    const result = await updatePlan('plan-1', formData);

    expect(result).toEqual({ success: true });
    expect(mockSupabase.from).toHaveBeenCalledWith('membership_plans');
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'plan-1');

    // Audit log should NOT be inserted
    expect(mockInsert).not.toHaveBeenCalled();

    expect(revalidatePath).toHaveBeenCalledWith('/owner/plans');
  });

  it('returns error when Supabase update fails', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
    });

    mockUpdateEq.mockResolvedValue({ error: { message: 'Database error' } });

    const formData = getFormData();
    const result = await updatePlan('plan-1', formData);

    expect(result).toEqual({ error: 'Database error' });
    expect(mockSupabase.from).toHaveBeenCalledWith('membership_plans');
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'plan-1');

    // Audit log and revalidatePath should not be called
    expect(mockInsert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});