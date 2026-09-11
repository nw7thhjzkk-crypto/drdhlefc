import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/owner", "/trainer", "/member"] as const;

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase not configured: the public homepage must still render,
  // but the ERP portals stay fail-closed — nobody can authenticate
  // without Supabase, so portal routes redirect to /login rather than
  // crashing every route with a 500.
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isProtectedPath(request.nextUrl.pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // refreshing the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login');

  // Protect routes
  if (
    !user &&
    (request.nextUrl.pathname.startsWith('/owner') ||
      request.nextUrl.pathname.startsWith('/trainer') ||
      request.nextUrl.pathname.startsWith('/member'))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role;

    let dashboardPath = '/';
    if (role === 'owner') dashboardPath = '/owner/dashboard';
    else if (role === 'trainer') dashboardPath = '/trainer/dashboard';
    else if (role === 'member') dashboardPath = '/member/home';

    if (isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = dashboardPath;
      return NextResponse.redirect(url);
    }

    const isOwnerRoute = request.nextUrl.pathname.startsWith('/owner');
    const isTrainerRoute = request.nextUrl.pathname.startsWith('/trainer');
    const isMemberRoute = request.nextUrl.pathname.startsWith('/member');

    if (
      (isOwnerRoute && role !== 'owner') ||
      (isTrainerRoute && role !== 'trainer') ||
      (isMemberRoute && role !== 'member')
    ) {
      const url = request.nextUrl.clone();
      url.pathname = dashboardPath;
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
