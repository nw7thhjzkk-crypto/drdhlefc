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

import type { CookieOptions } from '@supabase/ssr';
import type { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies';

// Define a type for the options argument based on the actual usage in createServerClient
type CreateServerClientOptions = {
  cookies: {
    getAll: () => RequestCookie[];
    setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => void;
  };
};

describe('createClient (Server)', () => {
  let mockCookieStore: {
    getAll: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    mockCookieStore = {
      getAll: vi.fn().mockReturnValue([{ name: 'test-cookie', value: 'test-value' }]),
      set: vi.fn(),
    };

    // Use unknown then cast to avoid any
    (cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockCookieStore);
    (createServerClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ dummy: 'client' });
  });

  it('should call createServerClient with correct environment variables', async () => {
    const client = await createClient();

    expect(createServerClient).toHaveBeenCalledWith(
      'http://localhost:54321',
      'test-anon-key',
      expect.any(Object)
    );
    expect(client).toEqual({ dummy: 'client' });
  });

  it('getAll should return cookies from cookieStore', async () => {
    await createClient();

    const mockCreateServerClient = createServerClient as unknown as ReturnType<typeof vi.fn>;
    const optionsArg = mockCreateServerClient.mock.calls[0][2] as CreateServerClientOptions;
    const cookiesOption = optionsArg.cookies;

    const allCookies = cookiesOption.getAll();
    expect(mockCookieStore.getAll).toHaveBeenCalled();
    expect(allCookies).toEqual([{ name: 'test-cookie', value: 'test-value' }]);
  });

  it('setAll should call cookieStore.set for each cookie', async () => {
    await createClient();

    const mockCreateServerClient = createServerClient as unknown as ReturnType<typeof vi.fn>;
    const optionsArg = mockCreateServerClient.mock.calls[0][2] as CreateServerClientOptions;
    const cookiesOption = optionsArg.cookies;

    const cookiesToSet = [
      { name: 'cookie1', value: 'value1', options: { path: '/' } },
      { name: 'cookie2', value: 'value2', options: { path: '/test' } },
    ];

    cookiesOption.setAll(cookiesToSet);

    expect(mockCookieStore.set).toHaveBeenCalledTimes(2);
    expect(mockCookieStore.set).toHaveBeenNthCalledWith(1, 'cookie1', 'value1', { path: '/' });
    expect(mockCookieStore.set).toHaveBeenNthCalledWith(2, 'cookie2', 'value2', { path: '/test' });
  });

  it('setAll should catch errors silently (e.g. from Server Components)', async () => {
    mockCookieStore.set.mockImplementation(() => {
      throw new Error('Server component error');
    });

    await createClient();

    const mockCreateServerClient = createServerClient as unknown as ReturnType<typeof vi.fn>;
    const optionsArg = mockCreateServerClient.mock.calls[0][2] as CreateServerClientOptions;
    const cookiesOption = optionsArg.cookies;

    const cookiesToSet = [
      { name: 'cookie1', value: 'value1', options: { path: '/' } },
    ];

    // Should not throw
    expect(() => cookiesOption.setAll(cookiesToSet)).not.toThrow();
    expect(mockCookieStore.set).toHaveBeenCalledTimes(1);
  });
});
