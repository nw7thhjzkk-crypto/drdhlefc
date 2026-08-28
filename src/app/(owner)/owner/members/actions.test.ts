import { describe, it, expect, vi, beforeEach } from 'vitest';
import { archiveMember } from './actions';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

// Mock dependencies
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('archiveMember', () => {
  let mockUpdateEq: ReturnType<typeof vi.fn>;
  let mockUpdate: ReturnType<typeof vi.fn>;
  let mockInsert: ReturnType<typeof vi.fn>;
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockGetSession: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup chainable Supabase mocks carefully
    mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
    mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });

    mockInsert = vi.fn().mockResolvedValue({ error: null });

    mockFrom = vi.fn().mockImplementation((table) => {
      if (table === 'members') {
        return { update: mockUpdate };
      }
      if (table === 'audit_logs') {
        return { insert: mockInsert };
      }
      return {};
    });

    mockGetSession = vi.fn().mockResolvedValue({
      data: { session: { user: { id: 'test-user-id' } } }
    });

    const mockSupabaseClient = {
      from: mockFrom,
      auth: {
        getSession: mockGetSession
      }
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient as never);
  });

  it('successfully archives a member and logs audit if user session exists', async () => {
    const memberId = 'test-member-123';
    const result = await archiveMember(memberId);

    // Verify Supabase updates
    expect(mockFrom).toHaveBeenCalledWith('members');
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'inactive' });
    expect(mockUpdateEq).toHaveBeenCalledWith('id', memberId);

    // Verify audit log
    expect(mockGetSession).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith('audit_logs');
    expect(mockInsert).toHaveBeenCalledWith({
      actor_profile_id: 'test-user-id',
      action: 'archive_member',
      entity_type: 'member',
      entity_id: memberId,
      member_id: memberId,
      details: { status: 'inactive' }
    });

    // Verify revalidatePath calls
    expect(revalidatePath).toHaveBeenCalledWith(`/owner/members/${memberId}`);
    expect(revalidatePath).toHaveBeenCalledWith('/owner/members');

    // Verify return value
    expect(result).toEqual({ success: true });
  });

  it('successfully archives a member but skips audit log if no user session', async () => {
    // Mock no user session
    mockGetSession.mockResolvedValueOnce({
      data: { session: null }
    });

    const memberId = 'test-member-456';
    const result = await archiveMember(memberId);

    // Verify Supabase updates
    expect(mockFrom).toHaveBeenCalledWith('members');
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'inactive' });
    expect(mockUpdateEq).toHaveBeenCalledWith('id', memberId);

    // Verify audit log skipped
    expect(mockInsert).not.toHaveBeenCalled();

    // Verify revalidatePath calls
    expect(revalidatePath).toHaveBeenCalledWith(`/owner/members/${memberId}`);
    expect(revalidatePath).toHaveBeenCalledWith('/owner/members');

    // Verify return value
    expect(result).toEqual({ success: true });
  });

  it('returns error if Supabase update fails', async () => {
    const errorMessage = 'Database connection error';
    mockUpdateEq.mockResolvedValueOnce({ error: { message: errorMessage } });

    const memberId = 'test-member-789';
    const result = await archiveMember(memberId);

    // Verify Supabase updates attempted
    expect(mockFrom).toHaveBeenCalledWith('members');
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'inactive' });
    expect(mockUpdateEq).toHaveBeenCalledWith('id', memberId);

    // Verify audit log and revalidatePath are NOT called
    expect(mockGetSession).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();

    // Verify return value is the error
    expect(result).toEqual({ error: errorMessage });
  });
});
