import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addAssessment } from '../actions';
import { revalidatePath } from 'next/cache';

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock Supabase client
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockFrom = vi.fn();
const mockGetSession = vi.fn();

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: mockGetSession,
    },
    from: mockFrom,
  })),
}));

describe('addAssessment', () => {
  const memberId = 'member-123';
  const mockUserId = 'user-456';

  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful setup
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: mockUserId } } },
    });

    mockFrom.mockReturnValue({ insert: mockInsert });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ single: mockSingle });

    // Default single mock return for assessments table
    mockSingle.mockResolvedValue({
      data: { id: 'assessment-789' },
      error: null,
    });
  });

  it('calculates BMI correctly when height and weight are valid', async () => {
    const formData = new FormData();
    formData.append('height_cm', '180');
    formData.append('weight_kg', '80');
    formData.append('body_fat_pct', '15');
    formData.append('notes', 'Looking good');

    const result = await addAssessment(memberId, formData);

    expect(result).toEqual({ success: true });

    // Check assessments insert
    expect(mockFrom).toHaveBeenCalledWith('assessments');
    expect(mockInsert).toHaveBeenCalledWith({
      member_id: memberId,
      recorded_by: mockUserId,
      source: 'manual',
      height_cm: 180,
      weight_kg: 80,
      bmi: 24.69,
      body_fat_pct: 15,
      notes: 'Looking good'
    });

    // Check audit_logs insert
    expect(mockFrom).toHaveBeenCalledWith('audit_logs');
    expect(mockInsert).toHaveBeenCalledWith({
      actor_profile_id: mockUserId,
      action: 'add_assessment',
      entity_type: 'assessment',
      entity_id: 'assessment-789',
      member_id: memberId,
      details: {
        height_cm: 180,
        weight_kg: 80,
        bmi: 24.69,
        body_fat_pct: 15
      }
    });

    expect(revalidatePath).toHaveBeenCalledWith(`/owner/members/${memberId}`);
  });

  it('sets BMI to null if height is zero or missing', async () => {
    const formData = new FormData();
    formData.append('height_cm', '0');
    formData.append('weight_kg', '80');

    const result = await addAssessment(memberId, formData);

    expect(result).toEqual({ success: true });

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      bmi: null
    }));
  });

  it('sets BMI to null if weight is zero or missing', async () => {
    const formData = new FormData();
    formData.append('height_cm', '180');
    formData.append('weight_kg', '0');

    const result = await addAssessment(memberId, formData);

    expect(result).toEqual({ success: true });

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      bmi: null
    }));
  });

  it('returns an error if the database insert fails', async () => {
    const formData = new FormData();
    formData.append('height_cm', '180');
    formData.append('weight_kg', '80');

    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' },
    });

    const result = await addAssessment(memberId, formData);

    expect(result).toEqual({ error: 'Database error' });

    // Audit log should not be called
    expect(mockFrom).not.toHaveBeenCalledWith('audit_logs');
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('does not log to audit_logs if recorded_by is missing', async () => {
    const formData = new FormData();
    formData.append('height_cm', '180');
    formData.append('weight_kg', '80');

    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
    });

    const result = await addAssessment(memberId, formData);

    expect(result).toEqual({ success: true });

    expect(mockFrom).not.toHaveBeenCalledWith('audit_logs');
    expect(revalidatePath).toHaveBeenCalledWith(`/owner/members/${memberId}`);
  });
});
