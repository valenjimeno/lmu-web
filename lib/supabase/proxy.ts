import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  authRedirectParam,
  buildPostLoginRedirectTarget,
  isProtectedAppRoute,
  resolvePostLoginRedirect,
} from '@/lib/supabase/auth';
import type { Database } from '@/types/database.types';
import { routes } from '@/lib/constants/routes';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  const pathname = request.nextUrl.pathname;

  if (!claims && isProtectedAppRoute(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = routes.login;
    redirectUrl.search = '';
    redirectUrl.searchParams.set(
      authRedirectParam,
      buildPostLoginRedirectTarget(request.nextUrl.pathname, request.nextUrl.search),
    );

    return NextResponse.redirect(redirectUrl);
  }

  if (claims && pathname === routes.login) {
    const redirectUrl = request.nextUrl.clone();
    const nextPath = resolvePostLoginRedirect(request.nextUrl.searchParams.get(authRedirectParam));

    redirectUrl.pathname = nextPath;
    redirectUrl.search = '';

    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
