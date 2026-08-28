import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateTrainer } from './actions';

const mockRevalidatePath = vi.fn();
vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args)
}));

const mockGetSession = vi.fn();
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockInsert = vi.fn();

const mockFrom = vi.fn((table: string) => {
  if (table === 'trainers') {
    return {
      update: mockUpdate,
    };
  }
  if (table === 'audit_logs') {
    return {
      insert: mockInsert,
    };
  }
  return {};
});

const mockStorageFrom = vi.fn((_bucket: string) => {
  return {
    upload: mockUpload,
    getPublicUrl: mockGetPublicUrl,
  };
});

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: mockGetSession,
    },
    from: mockFrom,
    storage: {
      from: mockStorageFrom,
    },
  })),
}));

describe('updateTrainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockReturnValue({ eq: mockEq });
  });

  it('updates a trainer successfully without a photo', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'test-user-id' } } }
    });
    mockEq.mockResolvedValue({ error: null });

    const formData = new FormData();
    formData.append('name', 'John Doe');
    formData.append('email', 'john@example.com');
    formData.append('salary_basic', '1000');

    const result = await updateTrainer('test-trainer-id', formData);

    expect(result).toEqual({ success: true });

    expect(mockUpdate).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      salary_basic: '1000'
    });
    expect(mockEq).toHaveBeenCalledWith('id', 'test-trainer-id');

    expect(mockInsert).toHaveBeenCalledWith({
      actor_profile_id: 'test-user-id',
      action: 'update_trainer',
      entity_type: 'trainer',
      entity_id: 'test-trainer-id',
      details: {
        name: 'John Doe',
        email: 'john@example.com',
        salary_basic: '1000'
      }
    });

    expect(mockRevalidatePath).toHaveBeenCalledWith('/owner/trainers/test-trainer-id');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/owner/trainers');
  });

  it('updates a trainer successfully with a photo', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'test-user-id' } } }
    });
    mockEq.mockResolvedValue({ error: null });
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.com/photo.jpg' } });

    const formData = new FormData();
    formData.append('name', 'Jane Doe');

    const mockFile = new File(['test content'], 'photo.jpg', { type: 'image/jpeg' });
    formData.append('photo', mockFile);

    const result = await updateTrainer('test-trainer-id', formData);

    expect(result).toEqual({ success: true });

    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringMatching(/^trainers\/0\.\d+\.jpg$/),
      mockFile
    );
    expect(mockGetPublicUrl).toHaveBeenCalled();

    expect(mockUpdate).toHaveBeenCalledWith({
      name: 'Jane Doe',
      photo_url: 'https://example.com/photo.jpg'
    });

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      action: 'update_trainer',
      details: {
        name: 'Jane Doe',
        photo_url: 'https://example.com/photo.jpg'
      }
    }));
  });

  it('handles storage upload error', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'test-user-id' } } }
    });
    mockUpload.mockResolvedValue({ error: { message: 'Upload failed' } });

    const formData = new FormData();
    const mockFile = new File(['test content'], 'photo.jpg', { type: 'image/jpeg' });
    formData.append('photo', mockFile);

    const result = await updateTrainer('test-trainer-id', formData);

    expect(result).toEqual({ error: 'Upload failed' });

    expect(mockUpload).toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('handles database update error', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'test-user-id' } } }
    });
    mockEq.mockResolvedValue({ error: { message: 'Database error' } });

    const formData = new FormData();
    formData.append('name', 'John Doe');

    const result = await updateTrainer('test-trainer-id', formData);

    expect(result).toEqual({ error: 'Database error' });

    expect(mockUpdate).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it('updates a trainer anonymously (skips audit log)', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null }
    });
    mockEq.mockResolvedValue({ error: null });

    const formData = new FormData();
    formData.append('name', 'John Doe');

    const result = await updateTrainer('test-trainer-id', formData);

    expect(result).toEqual({ success: true });

    expect(mockUpdate).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith('/owner/trainers/test-trainer-id');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/owner/trainers');
  });

});
