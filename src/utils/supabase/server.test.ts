import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from './server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

describe('createClient server utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  });

  it('should swallow errors when setting cookies in setAll', async () => {
    const mockCookieStore = {
      getAll: vi.fn().mockReturnValue([]),
      set: vi.fn().mockImplementation(() => {
        throw new Error('Cannot set cookies');
      }),
    };

    vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>);

    await createClient();

    // Verify createServerClient was called and extract the setAll callback
    expect(createServerClient).toHaveBeenCalledTimes(1);

    const options = vi.mocked(createServerClient).mock.calls[0][2];
    expect(options).toBeDefined();
    expect(options?.cookies).toBeDefined();

    // Call setAll with some mock cookies
    const cookiesToSet = [{ name: 'test-cookie', value: 'test-value', options: { path: '/' } }];

    // This should not throw because the error is caught inside setAll
    expect(() => {
      // @ts-ignore
      options?.cookies?.setAll?.(cookiesToSet);
    }).not.toThrow();

    // Verify that cookieStore.set was actually called
    expect(mockCookieStore.set).toHaveBeenCalledWith('test-cookie', 'test-value', { path: '/' });
  });

  it('should call cookieStore.getAll in getAll', async () => {
    const mockCookieStore = {
      getAll: vi.fn().mockReturnValue([{ name: 'test', value: '123' }]),
      set: vi.fn(),
    };

    vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>);

    await createClient();

    const options = vi.mocked(createServerClient).mock.calls[0][2];

    const result = options?.cookies?.getAll?.();
    expect(result).toEqual([{ name: 'test', value: '123' }]);
    expect(mockCookieStore.getAll).toHaveBeenCalledTimes(1);
  });
});
