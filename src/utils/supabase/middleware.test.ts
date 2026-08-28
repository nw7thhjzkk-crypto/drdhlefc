import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateSession } from './middleware';
import { type NextRequest } from 'next/server';

// Mock process.env
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';

// Mock dependencies
vi.mock('next/server', () => {
  const redirect = vi.fn((url) => ({
    type: 'redirect',
    url,
  }));
  const next = vi.fn((arg) => {
    return {
      type: 'next',
      request: arg?.request,
      cookies: {
        set: vi.fn(),
      }
    };
  });
  return {
    NextResponse: {
      redirect,
      next,
    },
  };
});

let mockUser: unknown = null;
let mockProfile: unknown = null;
let mockSetAllCookies: { name: string; value: string; options?: unknown }[] = [];

// Mock Supabase Server Client
vi.mock('@supabase/ssr', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createServerClient: (url: string, key: string, options: any) => {
      // Expose the cookies object so we can test it if needed
      if (options?.cookies?.setAll && mockSetAllCookies.length > 0) {
        options.cookies.setAll(mockSetAllCookies);
      }
      return {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockProfile,
              }),
            }),
          }),
        }),
      };
    },
  };
});

describe('updateSession Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;
    mockProfile = null;
    mockSetAllCookies = [];
  });

  function createMockRequest(pathname: string) {
    return {
      nextUrl: {
        pathname,
        clone: () => ({ pathname }),
      },
      cookies: {
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn(),
      },
    } as unknown as NextRequest;
  }

  describe('Unauthenticated users', () => {
    it('should redirect unauthenticated users to /login when accessing protected routes', async () => {
      const protectedRoutes = ['/owner/dashboard', '/trainer/clients', '/member/schedule'];

      for (const route of protectedRoutes) {
        const req = createMockRequest(route);
        const res = await updateSession(req);

        expect(res).toEqual({
          type: 'redirect',
          url: expect.objectContaining({ pathname: '/login' }),
        });
      }
    });

    it('should allow unauthenticated users to access public routes', async () => {
      const publicRoutes = ['/', '/login', '/signup', '/about'];

      for (const route of publicRoutes) {
        const req = createMockRequest(route);
        const res = await updateSession(req);

        expect(res.type).toBe('next');
      }
    });
  });

  describe('Authenticated users', () => {
    const roles = [
      { role: 'owner', dashboardPath: '/owner/dashboard' },
      { role: 'trainer', dashboardPath: '/trainer/dashboard' },
      { role: 'member', dashboardPath: '/member/home' },
    ];

    it('should redirect logged-in users away from /login to their dashboard', async () => {
      mockUser = { id: 'user123' };

      for (const { role, dashboardPath } of roles) {
        mockProfile = { role };
        const req = createMockRequest('/login');
        const res = await updateSession(req);

        expect(res).toEqual({
          type: 'redirect',
          url: expect.objectContaining({ pathname: dashboardPath }),
        });
      }
    });

    it('should allow users to access their own role routes', async () => {
      mockUser = { id: 'user123' };

      const routes = [
        { role: 'owner', path: '/owner/settings' },
        { role: 'trainer', path: '/trainer/clients' },
        { role: 'member', path: '/member/profile' },
      ];

      for (const { role, path } of routes) {
        mockProfile = { role };
        const req = createMockRequest(path);
        const res = await updateSession(req);

        expect(res.type).toBe('next');
      }
    });

    it('should redirect users to their dashboard if they access an unauthorized protected route', async () => {
      mockUser = { id: 'user123' };

      const testCases = [
        { role: 'member', path: '/owner/settings', expected: '/member/home' },
        { role: 'trainer', path: '/member/profile', expected: '/trainer/dashboard' },
        { role: 'owner', path: '/trainer/clients', expected: '/owner/dashboard' },
      ];

      for (const { role, path, expected } of testCases) {
        mockProfile = { role };
        const req = createMockRequest(path);
        const res = await updateSession(req);

        expect(res).toEqual({
          type: 'redirect',
          url: expect.objectContaining({ pathname: expected }),
        });
      }
    });

    it('should handle users without a recognized role gracefully', async () => {
      mockUser = { id: 'user123' };
      mockProfile = { role: 'unknown' };

      const req = createMockRequest('/owner/settings');
      const res = await updateSession(req);

      // Defaults to '/'
      expect(res).toEqual({
        type: 'redirect',
        url: expect.objectContaining({ pathname: '/' }),
      });
    });
  });

  describe('Cookie management', () => {
    it('should test setAll branches in createServerClient', async () => {
      // In order to hit the `setAll` paths properly, we will mock `createServerClient`'s
      // cookie setup. To trigger it we push to `mockSetAllCookies`.
      mockSetAllCookies = [{ name: 'test-cookie', value: '123' }, { name: 'test-cookie2', value: '456', options: { httpOnly: true } }];
      const req = createMockRequest('/');
      const res = await updateSession(req);

      // Next gets called when cookie setAll is called, plus our initial NextResponse.next call.
      // So checking type is 'next' shows it didn't crash.
      expect(res.type).toBe('next');
      // The inner response mock doesn't retain properties cleanly with this setup,
      // but execution without throwing validates the syntactic check of `cookiesToSet.forEach`.
    });
  });
});
