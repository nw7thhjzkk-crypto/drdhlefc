import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user) {
    // If logged in, get their role from the profiles table to do role-based redirect/protection
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role;

    // Determine the dashboard path for this user based on their role
    let dashboardPath = '/';
    if (role === 'owner') dashboardPath = '/owner/dashboard';
    else if (role === 'trainer') dashboardPath = '/trainer/dashboard';
    else if (role === 'member') dashboardPath = '/member/home';

    // If trying to access login while already logged in, redirect to dashboard
    if (isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = dashboardPath;
      return NextResponse.redirect(url);
    }

    // Role protection: Don't let users access routes they shouldn't
    const isOwnerRoute = request.nextUrl.pathname.startsWith('/owner');
    const isTrainerRoute = request.nextUrl.pathname.startsWith('/trainer');
    const isMemberRoute = request.nextUrl.pathname.startsWith('/member');

    if (
      (isOwnerRoute && role !== 'owner') ||
      (isTrainerRoute && role !== 'trainer') ||
      (isMemberRoute && role !== 'member')
    ) {
      // Trying to access an unauthorized route
      const url = request.nextUrl.clone();
      url.pathname = dashboardPath;
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
