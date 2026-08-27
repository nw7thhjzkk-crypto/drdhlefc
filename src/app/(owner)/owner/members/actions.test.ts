import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addAssessment } from './actions';

// Mock the Supabase client
vi.mock('@/utils/supabase/server', () => {
  const insertMock = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { id: 'test-assessment-id' }, error: null }),
    }),
  });

  const getSessionMock = vi.fn().mockResolvedValue({
    data: { session: { user: { id: 'test-user-id' } } },
  });

  return {
    createClient: vi.fn().mockResolvedValue({
      auth: { getSession: getSessionMock },
      from: vi.fn((table) => {
        if (table === 'assessments') return { insert: insertMock };
        if (table === 'audit_logs') return { insert: vi.fn().mockResolvedValue({}) };
        return { insert: vi.fn().mockResolvedValue({}) };
      }),
    }),
  };
});

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('addAssessment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates BMI correctly with valid height and weight', async () => {
    const formData = new FormData();
    formData.append('height_cm', '180');
    formData.append('weight_kg', '80');
    formData.append('body_fat_pct', '15');
    formData.append('notes', 'Test notes');

    const result = await addAssessment('test-member-id', formData);

    expect(result).toEqual({ success: true });

    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();

    // Verify assessments insert was called with the correct BMI
    expect(supabase.from).toHaveBeenCalledWith('assessments');
    const insertMock = supabase.from('assessments').insert;

    // BMI = 80 / (1.8 * 1.8) = 24.691358... -> 24.69
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      member_id: 'test-member-id',
      height_cm: 180,
      weight_kg: 80,
      bmi: 24.69,
      body_fat_pct: 15,
      notes: 'Test notes',
    }));
  });

  it('sets BMI to null when height is 0', async () => {
    const formData = new FormData();
    formData.append('height_cm', '0');
    formData.append('weight_kg', '80');
    formData.append('body_fat_pct', '15');
    formData.append('notes', 'Test notes');

    const result = await addAssessment('test-member-id', formData);

    expect(result).toEqual({ success: true });

    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();

    const insertMock = supabase.from('assessments').insert;

    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      bmi: null,
    }));
  });

  it('sets BMI to null when weight is 0', async () => {
    const formData = new FormData();
    formData.append('height_cm', '180');
    formData.append('weight_kg', '0');
    formData.append('body_fat_pct', '15');
    formData.append('notes', 'Test notes');

    const result = await addAssessment('test-member-id', formData);

    expect(result).toEqual({ success: true });

    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();

    const insertMock = supabase.from('assessments').insert;

    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      bmi: null,
    }));
  });

  it('sets BMI to null when height is negative', async () => {
    const formData = new FormData();
    formData.append('height_cm', '-180');
    formData.append('weight_kg', '80');
    formData.append('body_fat_pct', '15');
    formData.append('notes', 'Test notes');

    const result = await addAssessment('test-member-id', formData);

    expect(result).toEqual({ success: true });

    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();

    const insertMock = supabase.from('assessments').insert;

    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      bmi: null,
    }));
  });

  it('sets BMI to null when height or weight are not provided (NaN)', async () => {
    const formData = new FormData();
    // Not appending height or weight
    formData.append('body_fat_pct', '15');
    formData.append('notes', 'Test notes');

    const result = await addAssessment('test-member-id', formData);

    expect(result).toEqual({ success: true });

    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();

    const insertMock = supabase.from('assessments').insert;

    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      bmi: null,
    }));
  });
});
