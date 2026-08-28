import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTrainer } from './actions';
import { revalidatePath } from 'next/cache';
import * as supabaseServer from '@/utils/supabase/server';
import * as supabaseJs from '@supabase/supabase-js';

// Mock dependencies
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

describe('createTrainer action', () => {
  let mockSupabaseClient: any;
  let mockAdminClient: any;
  let mockSessionData: any;
  let mockUpload: any;
  let mockGetPublicUrl: any;
  let mockInsertTrainer: any;
  let mockSelectTrainer: any;
  let mockSingleTrainer: any;
  let mockInsertAudit: any;
  let mockCreateUser: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSessionData = {
      data: { session: { user: { id: 'test-user-id' } } }
    };

    mockUpload = vi.fn().mockResolvedValue({ error: null });
    mockGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: 'http://example.com/photo.jpg' } });

    mockSingleTrainer = vi.fn().mockResolvedValue({ data: { id: 'new-trainer-id' }, error: null });
    mockSelectTrainer = vi.fn().mockReturnValue({ single: mockSingleTrainer });
    mockInsertTrainer = vi.fn().mockReturnValue({ select: mockSelectTrainer });
    mockInsertAudit = vi.fn().mockResolvedValue({ error: null });

    mockSupabaseClient = {
      auth: {
        getSession: vi.fn().mockResolvedValue(mockSessionData),
      },
      storage: {
        from: vi.fn().mockReturnValue({
          upload: mockUpload,
          getPublicUrl: mockGetPublicUrl,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'trainers') {
          return { insert: mockInsertTrainer };
        } else if (table === 'audit_logs') {
          return { insert: mockInsertAudit };
        }
        return {};
      }),
    };

    mockCreateUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'new-profile-id' } },
      error: null
    });

    mockAdminClient = {
      auth: {
        admin: {
          createUser: mockCreateUser
        }
      }
    };

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient as any);
    vi.mocked(supabaseJs.createClient).mockReturnValue(mockAdminClient as any);

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  });

  const createValidFormData = () => {
    const fd = new FormData();
    fd.append('name', 'John Doe');
    fd.append('email', 'john@example.com');
    fd.append('phone', '1234567890');
    fd.append('qualification', 'BSc');
    fd.append('specialization', 'Cardio');
    fd.append('joining_date', '2024-01-01');
    fd.append('salary_basic', '5000');
    fd.append('salary_allowances', '500');
    fd.append('salary_deductions', '100');
    fd.append('notes', 'Great trainer');
    return fd;
  };

  it('should create a trainer successfully without photo', async () => {
    const formData = createValidFormData();

    const response = await createTrainer(formData);

    expect(response).toEqual({ success: true, trainerId: 'new-trainer-id' });
    expect(mockUpload).not.toHaveBeenCalled();
    expect(mockCreateUser).toHaveBeenCalledWith({
      email: 'john@example.com',
      password: expect.any(String),
      email_confirm: true,
      user_metadata: { role: 'trainer', full_name: 'John Doe' }
    });

    expect(mockInsertTrainer).toHaveBeenCalledWith({
      profile_id: 'new-profile-id',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      photo_url: null,
      qualification: 'BSc',
      specialization: 'Cardio',
      joining_date: '2024-01-01',
      salary_basic: 5000,
      salary_allowances: 500,
      salary_deductions: 100,
      status: 'active',
      notes: 'Great trainer'
    });

    expect(mockInsertAudit).toHaveBeenCalledWith({
      actor_profile_id: 'test-user-id',
      action: 'create_trainer',
      entity_type: 'trainer',
      entity_id: 'new-trainer-id',
      details: { name: 'John Doe', email: 'john@example.com' }
    });

    expect(revalidatePath).toHaveBeenCalledWith('/owner/trainers');
  });

  it('should handle photo upload and create trainer successfully', async () => {
    const formData = createValidFormData();
    // Simulate a photo file
    const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 });
    formData.append('photo', file);

    const response = await createTrainer(formData);

    expect(response).toEqual({ success: true, trainerId: 'new-trainer-id' });
    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringContaining('trainers/'),
      file
    );
    expect(mockGetPublicUrl).toHaveBeenCalled();
    expect(mockInsertTrainer).toHaveBeenCalledWith(
      expect.objectContaining({
        photo_url: 'http://example.com/photo.jpg'
      })
    );
  });

  it('should return error if photo upload fails', async () => {
    mockUpload.mockResolvedValueOnce({ error: { message: 'Upload failed' } });
    const formData = createValidFormData();
    const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 });
    formData.append('photo', file);

    const response = await createTrainer(formData);

    expect(response).toEqual({ error: 'Upload failed' });
    expect(mockCreateUser).not.toHaveBeenCalled();
    expect(mockInsertTrainer).not.toHaveBeenCalled();
  });

  it('should return error if auth user creation fails', async () => {
    mockCreateUser.mockResolvedValueOnce({ data: null, error: { message: 'Auth failed' } });
    const formData = createValidFormData();

    const response = await createTrainer(formData);

    expect(response).toEqual({ error: 'Auth failed' });
    expect(mockInsertTrainer).not.toHaveBeenCalled();
  });

  it('should return error if trainer insertion fails', async () => {
    mockSingleTrainer.mockResolvedValueOnce({ data: null, error: { message: 'DB Error' } });
    const formData = createValidFormData();

    const response = await createTrainer(formData);

    expect(response).toEqual({ error: 'DB Error' });
    expect(mockInsertAudit).not.toHaveBeenCalled();
  });
});
