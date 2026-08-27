import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { recordPayment } from './actions';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('recordPayment', () => {
  let mockSupabase: any;
  let mockInsert: Mock;
  let mockSelect: Mock;
  let mockUpdate: Mock;
  let mockSingle: Mock;
  let mockSelectEq: Mock;
  let mockUpdateEq: Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSingle = vi.fn();
    mockSelectEq = vi.fn().mockReturnValue({ single: mockSingle });
    mockUpdateEq = vi.fn().mockResolvedValue({ data: null, error: null });

    mockSelect = vi.fn().mockReturnValue({
      eq: mockSelectEq,
      single: mockSingle
    });

    mockUpdate = vi.fn().mockReturnValue({
      eq: mockUpdateEq,
    });

    mockInsert = vi.fn().mockReturnValue({
      select: mockSelect,
      single: mockSingle
    });

    mockSupabase = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: 'test-user-id' } } }
        })
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'payments') {
            return { insert: mockInsert };
        } else if (table === 'memberships') {
            return { select: mockSelect, update: mockUpdate };
        } else if (table === 'audit_logs') {
            return { insert: mockInsert };
        }
        return {};
      }),
    };

    (createClient as Mock).mockResolvedValue(mockSupabase);
  });

  it('should return error if missing required fields', async () => {
    const formData = new FormData();

    const result = await recordPayment(formData);

    expect(result).toEqual({ error: 'Missing required fields' });
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('should return error if payment insertion fails', async () => {
    const formData = new FormData();
    formData.append('member_id', 'm1');
    formData.append('membership_id', 'ms1');
    formData.append('amount', '100');
    formData.append('method', 'cash');

    // Setup the single() call for 'payments' insert to return an error
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' }
    });

    const result = await recordPayment(formData);

    expect(result).toEqual({ error: 'Database error' });
    expect(mockSupabase.from).toHaveBeenCalledWith('payments');
  });

  it('records payment and updates membership status to active', async () => {
    const formData = new FormData();
    formData.append('member_id', 'm1');
    formData.append('membership_id', 'ms1');
    formData.append('amount', '50');
    formData.append('method', 'card');
    formData.append('reference', 'ref-123');
    formData.append('notes', 'some note');

    // 1. Payment insert success
    mockSingle.mockResolvedValueOnce({
      data: { id: 'p1' },
      error: null
    });

    // 2. Membership select success, existing pending amount is 50, so new pending will be 0 (active)
    mockSingle.mockResolvedValueOnce({
      data: { total_amount: 100, paid_amount: 50 },
      error: null
    });

    const result = await recordPayment(formData);

    expect(result).toEqual({ success: true });

    expect(mockUpdate).toHaveBeenCalledWith({
      paid_amount: 100,
      pending_amount: 0,
      status: 'active'
    });

    expect(revalidatePath).toHaveBeenCalledWith('/owner/payments');
    expect(revalidatePath).toHaveBeenCalledWith('/owner/members/m1');
  });

  it('records payment and updates membership status to pending_payment', async () => {
    const formData = new FormData();
    formData.append('member_id', 'm1');
    formData.append('membership_id', 'ms1');
    formData.append('amount', '20');
    formData.append('method', 'card');

    // 1. Payment insert success
    mockSingle.mockResolvedValueOnce({
      data: { id: 'p2' },
      error: null
    });

    // 2. Membership select success, existing paid 50, new paid 70, pending 30
    mockSingle.mockResolvedValueOnce({
      data: { total_amount: 100, paid_amount: 50 },
      error: null
    });

    const result = await recordPayment(formData);

    expect(result).toEqual({ success: true });

    expect(mockUpdate).toHaveBeenCalledWith({
      paid_amount: 70,
      pending_amount: 30,
      status: 'pending_payment'
    });
  });

  it('creates audit log if user is logged in', async () => {
      const formData = new FormData();
      formData.append('member_id', 'm1');
      formData.append('membership_id', 'ms1');
      formData.append('amount', '20');

      // 1. Payment insert success
      mockSingle.mockResolvedValueOnce({
        data: { id: 'p-id' },
        error: null
      });

      // 2. Membership select success
      mockSingle.mockResolvedValueOnce({
        data: { total_amount: 100, paid_amount: 0 },
        error: null
      });

      const result = await recordPayment(formData);

      expect(result).toEqual({ success: true });

      // Verify audit logs
      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
      expect(mockInsert).toHaveBeenCalledWith({
          actor_profile_id: 'test-user-id',
          action: 'record_payment',
          entity_type: 'payment',
          entity_id: 'p-id',
          member_id: 'm1',
          details: { amount: 20, method: null }
      });
  });
});
