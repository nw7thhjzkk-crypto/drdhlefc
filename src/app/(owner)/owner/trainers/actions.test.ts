import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTrainer } from './actions';
import { revalidatePath } from 'next/cache';

// Mock Next.js dependencies
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock process.env for admin client creation
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-url.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockAuthAdminCreateUser = vi.fn();
const mockFromInsert = vi.fn();
const mockInsertSelectSingle = vi.fn();
const mockAuditLogInsert = vi.fn();
const mockGetSession = vi.fn();

// The mocked Supabase client structure
const mockSupabaseClient = {
  auth: {
    getSession: mockGetSession,
    admin: {
      createUser: mockAuthAdminCreateUser,
    }
  },
  storage: {
    from: vi.fn().mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    }),
  },
  from: vi.fn((table) => {
    if (table === 'trainers') {
      return {
        insert: mockFromInsert.mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: mockInsertSelectSingle,
          }),
        }),
      };
    }
    if (table === 'audit_logs') {
      return {
        insert: mockAuditLogInsert,
      };
    }
    return {};
  }),
};

// Mock our custom createClient wrapper
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabaseClient),
}));

// Mock the @supabase/supabase-js library directly for the admin client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}));

describe('Trainer Actions - createTrainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful session mock
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } }
    });
  });

  const generateValidFormData = () => {
    const formData = new FormData();
    formData.append('name', 'John Doe');
    formData.append('email', 'john@example.com');
    formData.append('phone', '1234567890');
    formData.append('qualification', 'Certified PT');
    formData.append('specialization', 'Strength');
    formData.append('joining_date', '2023-01-01');
    formData.append('salary_basic', '5000');
    return formData;
  };

  it('should successfully create a trainer without a photo', async () => {
    const formData = generateValidFormData();

    mockAuthAdminCreateUser.mockResolvedValue({
      data: { user: { id: 'new-profile-123' } },
      error: null,
    });

    mockInsertSelectSingle.mockResolvedValue({
      data: { id: 'trainer-123' },
      error: null,
    });

    const result = await createTrainer(formData);

    expect(mockUpload).not.toHaveBeenCalled();
    expect(mockAuthAdminCreateUser).toHaveBeenCalledWith(expect.objectContaining({
      email: 'john@example.com',
      user_metadata: { role: 'trainer', full_name: 'John Doe' }
    }));
    expect(mockFromInsert).toHaveBeenCalledWith(expect.objectContaining({
      profile_id: 'new-profile-123',
      name: 'John Doe',
      status: 'active',
    }));
    expect(mockAuditLogInsert).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/owner/trainers');
    expect(result).toEqual({ success: true, trainerId: 'trainer-123' });
  });

  it('should successfully create a trainer with a photo', async () => {
    const formData = generateValidFormData();

    // Create a mock file
    const file = new File(['dummy content'], 'photo.jpg', { type: 'image/jpeg' });
    formData.append('photo', file);

    mockUpload.mockResolvedValue({ data: { path: 'test/path' }, error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://test-url.com/photo.jpg' } });

    mockAuthAdminCreateUser.mockResolvedValue({
      data: { user: { id: 'new-profile-123' } },
      error: null,
    });

    mockInsertSelectSingle.mockResolvedValue({
      data: { id: 'trainer-123' },
      error: null,
    });

    const result = await createTrainer(formData);

    expect(mockUpload).toHaveBeenCalled();
    expect(mockGetPublicUrl).toHaveBeenCalled();
    expect(mockFromInsert).toHaveBeenCalledWith(expect.objectContaining({
      photo_url: 'https://test-url.com/photo.jpg'
    }));
    expect(result).toEqual({ success: true, trainerId: 'trainer-123' });
  });

  it('should return error if photo upload fails', async () => {
    const formData = generateValidFormData();
    const file = new File(['dummy content'], 'photo.jpg', { type: 'image/jpeg' });
    formData.append('photo', file);

    mockUpload.mockResolvedValue({ error: { message: 'Upload failed' } });

    const result = await createTrainer(formData);

    expect(result).toEqual({ error: 'Upload failed' });
    expect(mockAuthAdminCreateUser).not.toHaveBeenCalled();
  });

  it('should return error if auth admin user creation fails', async () => {
    const formData = generateValidFormData();

    mockAuthAdminCreateUser.mockResolvedValue({
      data: null,
      error: { message: 'Auth creation failed' },
    });

    const result = await createTrainer(formData);

    expect(result).toEqual({ error: 'Auth creation failed' });
    expect(mockFromInsert).not.toHaveBeenCalled();
  });

  it('should return error if trainer record insertion fails', async () => {
    const formData = generateValidFormData();

    mockAuthAdminCreateUser.mockResolvedValue({
      data: { user: { id: 'new-profile-123' } },
      error: null,
    });

    mockInsertSelectSingle.mockResolvedValue({
      data: null,
      error: { message: 'Database insert failed' },
    });

    const result = await createTrainer(formData);

    expect(result).toEqual({ error: 'Database insert failed' });
    expect(mockAuditLogInsert).not.toHaveBeenCalled();
  });
});
