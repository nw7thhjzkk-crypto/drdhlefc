import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { updateSession } from './middleware';
import { NextResponse, NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Mock dependencies
vi.mock('next/server', () => {
  return {
    NextResponse: {
      next: vi.fn((init) => ({
        type: 'next',
        init,
        cookies: {
          set: vi.fn(),
        },
      })),
      redirect: vi.fn((url) => {
        let urlStr = '';
        if (typeof url === 'string') {
          urlStr = url;
        } else if (url && typeof url.toString === 'function' && url.toString() !== '[object Object]') {
          urlStr = url.toString();
        } else if (url && url.pathname) {
           urlStr = `http://localhost${url.pathname}`;
        }
        return {
          type: 'redirect',
          url: urlStr,
        };
      }),
    },
  };
});

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

describe('updateSession', () => {
  let mockGetUser: Mock;
  let mockSupabase: any;
  let mockSelect: Mock;
  let mockEq: Mock;
  let mockSingle: Mock;
  let mockFrom: Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    // Default env vars
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';

    mockGetUser = vi.fn().mockResolvedValue({ data: { user: null } });

    mockSingle = vi.fn().mockResolvedValue({ data: null });
    mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

    mockSupabase = {
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
    };

    (createServerClient as Mock).mockReturnValue(mockSupabase);
  });

  const createMockRequest = (pathname: string) => {
    const url = {
      pathname,
      clone: () => ({ ...url }),
    };
    Object.defineProperty(url, 'toString', {
      value: function() { return `http://localhost${this.pathname}`; }
    });

    return {
      nextUrl: url,
      cookies: {
        getAll: vi.fn().mockReturnValue([]),
        set: vi.fn(),
      },
    } as unknown as NextRequest;
  };

  describe('Unauthenticated access', () => {
    it('should proceed normally for public routes', async () => {
      const request = createMockRequest('/public-page');

      const response = await updateSession(request);

      expect(response.type).toBe('next');
      expect(NextResponse.next).toHaveBeenCalled();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });

    it('should redirect to login when accessing owner routes', async () => {
      const request = createMockRequest('/owner/dashboard');

      const response = await updateSession(request);

      expect(response.type).toBe('redirect');
      expect(NextResponse.redirect).toHaveBeenCalled();
      expect((response as any).url).toBe('http://localhost/login');
    });

    it('should redirect to login when accessing trainer routes', async () => {
      const request = createMockRequest('/trainer/dashboard');

      const response = await updateSession(request);

      expect(response.type).toBe('redirect');
      expect(NextResponse.redirect).toHaveBeenCalled();
      expect((response as any).url).toBe('http://localhost/login');
    });

    it('should redirect to login when accessing member routes', async () => {
      const request = createMockRequest('/member/home');

      const response = await updateSession(request);

      expect(response.type).toBe('redirect');
      expect(NextResponse.redirect).toHaveBeenCalled();
      expect((response as any).url).toBe('http://localhost/login');
    });
  });

  describe('Authenticated access - Role based redirection', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
    });

    describe('Owner role', () => {
      beforeEach(() => {
        mockSingle.mockResolvedValue({ data: { role: 'owner' } });
      });

      it('should redirect to dashboard from login page', async () => {
        const request = createMockRequest('/login');
        const response = await updateSession(request);

        expect(response.type).toBe('redirect');
        expect(NextResponse.redirect).toHaveBeenCalled();
        expect((response as any).url).toBe('http://localhost/owner/dashboard');
      });

      it('should allow access to owner routes', async () => {
        const request = createMockRequest('/owner/settings');
        const response = await updateSession(request);

        expect(response.type).toBe('next');
      });

      it('should redirect from trainer routes to owner dashboard', async () => {
        const request = createMockRequest('/trainer/dashboard');
        const response = await updateSession(request);

        expect(response.type).toBe('redirect');
        expect((response as any).url).toBe('http://localhost/owner/dashboard');
      });
    });

    describe('Trainer role', () => {
      beforeEach(() => {
        mockSingle.mockResolvedValue({ data: { role: 'trainer' } });
      });

      it('should allow access to trainer routes', async () => {
        const request = createMockRequest('/trainer/schedule');
        const response = await updateSession(request);

        expect(response.type).toBe('next');
      });

      it('should redirect from owner routes to trainer dashboard', async () => {
        const request = createMockRequest('/owner/dashboard');
        const response = await updateSession(request);

        expect(response.type).toBe('redirect');
        expect((response as any).url).toBe('http://localhost/trainer/dashboard');
      });
    });

    describe('Member role', () => {
      beforeEach(() => {
        mockSingle.mockResolvedValue({ data: { role: 'member' } });
      });

      it('should allow access to member routes', async () => {
        const request = createMockRequest('/member/workouts');
        const response = await updateSession(request);

        expect(response.type).toBe('next');
      });

      it('should redirect from trainer routes to member home', async () => {
        const request = createMockRequest('/trainer/schedule');
        const response = await updateSession(request);

        expect(response.type).toBe('redirect');
        expect((response as any).url).toBe('http://localhost/member/home');
      });
    });
  });
});
