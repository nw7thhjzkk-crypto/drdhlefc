import { createClient } from './server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

describe('createClient', () => {
  let mockCookieStore: any;

  beforeEach(() => {
    mockCookieStore = {
      getAll: jest.fn(),
      set: jest.fn(),
    };
    (cookies as jest.Mock).mockResolvedValue(mockCookieStore);
    (createServerClient as jest.Mock).mockClear();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call createServerClient with correct parameters', async () => {
    await createClient();

    expect(createServerClient).toHaveBeenCalledWith(
      'http://localhost',
      'anon-key',
      expect.objectContaining({
        cookies: expect.any(Object),
      })
    );
  });

  it('should get all cookies correctly', async () => {
    await createClient();

    const options = (createServerClient as jest.Mock).mock.calls[0][2];

    mockCookieStore.getAll.mockReturnValue([{ name: 'test', value: 'value' }]);

    const result = options.cookies.getAll();
    expect(result).toEqual([{ name: 'test', value: 'value' }]);
    expect(mockCookieStore.getAll).toHaveBeenCalled();
  });

  it('should set all cookies correctly', async () => {
    await createClient();

    const options = (createServerClient as jest.Mock).mock.calls[0][2];

    options.cookies.setAll([
      { name: 'test1', value: 'value1', options: { path: '/' } },
      { name: 'test2', value: 'value2', options: { path: '/about' } },
    ]);

    expect(mockCookieStore.set).toHaveBeenCalledTimes(2);
    expect(mockCookieStore.set).toHaveBeenCalledWith('test1', 'value1', { path: '/' });
    expect(mockCookieStore.set).toHaveBeenCalledWith('test2', 'value2', { path: '/about' });
  });

  it('should catch and ignore errors in setAll', async () => {
    await createClient();

    const options = (createServerClient as jest.Mock).mock.calls[0][2];

    mockCookieStore.set.mockImplementation(() => {
      throw new Error('Server component error');
    });

    expect(() => {
      options.cookies.setAll([
        { name: 'test1', value: 'value1', options: { path: '/' } },
      ]);
    }).not.toThrow();

    expect(mockCookieStore.set).toHaveBeenCalledTimes(1);
    expect(mockCookieStore.set).toHaveBeenCalledWith('test1', 'value1', { path: '/' });
  });
});
