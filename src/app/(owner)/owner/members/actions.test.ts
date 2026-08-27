import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMember } from './actions';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('createMember', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  const createMockFormData = (data: Record<string, any>) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    }
    return formData;
  };

  const mockSupabaseClient = (overrides = {}) => {
    const uploadMock = vi.fn().mockResolvedValue({ error: null });
    const getPublicUrlMock = vi.fn().mockReturnValue({ data: { publicUrl: 'http://example.com/photo.jpg' } });
    const insertAuditMock = vi.fn().mockResolvedValue({ error: null });
    const insertMemberMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 'member-123' }, error: null })
      })
    });
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null })
    });
    const deleteMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null })
    });
    const getSessionMock = vi.fn().mockResolvedValue({ data: { session: { user: { id: 'admin-123' } } } });

    const client = {
      storage: {
        from: vi.fn().mockReturnValue({
          upload: uploadMock,
          getPublicUrl: getPublicUrlMock,
        }),
      },
      from: vi.fn((table) => {
        if (table === 'members') return { insert: insertMemberMock, update: updateMock };
        if (table === 'audit_logs') return { insert: insertAuditMock };
        return { insert: vi.fn(), update: vi.fn(), delete: deleteMock };
      }),
      auth: {
        getSession: getSessionMock,
      },
      ...overrides
    };

    (createServerClient as any).mockResolvedValue(client);

    return { uploadMock, getPublicUrlMock, insertMemberMock, insertAuditMock, getSessionMock };
  };

  const mockAdminClient = (overrides = {}) => {
    const createUserMock = vi.fn().mockResolvedValue({
      data: { user: { id: 'profile-123' } },
      error: null
    });

    const adminClient = {
      auth: {
        admin: {
          createUser: createUserMock
        }
      },
      ...overrides
    };

    (createSupabaseClient as any).mockReturnValue(adminClient);

    return { createUserMock };
  };

  it('should create a member successfully with a photo', async () => {
    const { uploadMock, insertMemberMock, insertAuditMock } = mockSupabaseClient();
    const { createUserMock } = mockAdminClient();

    const photoFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(photoFile, 'size', { value: 1024 });

    const formData = createMockFormData({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      photo: photoFile
    });

    const result = await createMember(formData);

    expect(result).toEqual({ success: true, memberId: 'member-123' });
    expect(uploadMock).toHaveBeenCalled();
    expect(createUserMock).toHaveBeenCalled();
    expect(insertMemberMock).toHaveBeenCalled();
    expect(insertAuditMock).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/owner/members');
  });

  it('should create a member successfully without a photo', async () => {
    const { uploadMock, insertMemberMock } = mockSupabaseClient();
    const { createUserMock } = mockAdminClient();

    const formData = createMockFormData({
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '0987654321',
    });

    const result = await createMember(formData);

    expect(result).toEqual({ success: true, memberId: 'member-123' });
    expect(uploadMock).not.toHaveBeenCalled();
    expect(createUserMock).toHaveBeenCalled();
    expect(insertMemberMock).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/owner/members');
  });

  it('should return error if photo upload fails', async () => {
    mockSupabaseClient({
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ error: { message: 'Upload failed' } }),
          getPublicUrl: vi.fn(),
        }),
      }
    });

    const photoFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(photoFile, 'size', { value: 1024 });

    const formData = createMockFormData({
      name: 'John Doe',
      email: 'john@example.com',
      photo: photoFile
    });

    const result = await createMember(formData);

    expect(result).toEqual({ error: 'Upload failed' });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('should return error if auth user creation fails', async () => {
    mockSupabaseClient();
    mockAdminClient({
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({ error: { message: 'Auth creation failed' } })
        }
      }
    });

    const formData = createMockFormData({
      name: 'John Doe',
      email: 'john@example.com',
    });

    const result = await createMember(formData);

    expect(result).toEqual({ error: 'Auth creation failed' });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('should return error if member insertion fails', async () => {
    mockSupabaseClient();
    mockAdminClient();

    // Override insertMemberMock on the generic mock
    const client = await createServerClient();
    client.from = vi.fn().mockImplementation((table) => {
      if (table === 'members') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ error: { message: 'DB Insert failed' } })
            })
          })
        };
      }
      return { insert: vi.fn() };
    });

    const formData = createMockFormData({
      name: 'John Doe',
      email: 'john@example.com',
    });

    const result = await createMember(formData);

    expect(result).toEqual({ error: 'DB Insert failed' });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
