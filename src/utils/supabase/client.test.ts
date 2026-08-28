import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createClient } from './client';
import { createBrowserClient } from '@supabase/ssr';

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn()
}));

describe('Supabase Client Utility', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should call createBrowserClient with correct environment variables', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test-url.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');

    const mockClient = { auth: {} } as ReturnType<typeof createBrowserClient>;
    vi.mocked(createBrowserClient).mockReturnValue(mockClient);

    const client = createClient();

    expect(createBrowserClient).toHaveBeenCalledTimes(1);
    expect(createBrowserClient).toHaveBeenCalledWith(
      'https://test-url.supabase.co',
      'test-anon-key'
    );
    expect(client).toBe(mockClient);
  });
});
