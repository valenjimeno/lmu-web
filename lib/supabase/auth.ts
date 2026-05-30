import { createClient } from '@/lib/supabase/server';
import { routes } from '@/lib/constants/routes';

export const authRedirectParam = 'redirectTo';

const protectedRoutePrefixes = [
  routes.dashboard,
  routes.comparison,
  routes.setups,
  routes.sessions,
  routes.profile,
  routes.teams,
];

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    if (error.message === 'Auth session missing!') {
      return null;
    }

    throw error;
  }

  return user;
}

export function isAuthRoute(pathname: string) {
  return (
    pathname === routes.login || pathname === routes.auth || pathname.startsWith(`${routes.auth}/`)
  );
}

export function isProtectedAppRoute(pathname: string) {
  return protectedRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function resolvePostLoginRedirect(value: string | null | undefined) {
  if (!value) {
    return routes.setups;
  }

  try {
    const decodedValue = decodeURIComponent(value);

    if (!decodedValue.startsWith('/')) {
      return routes.setups;
    }

    if (
      decodedValue.startsWith('//') ||
      isAuthRoute(decodedValue) ||
      decodedValue.startsWith('/api')
    ) {
      return routes.setups;
    }

    return decodedValue;
  } catch {
    return routes.setups;
  }
}

export function buildPostLoginRedirectTarget(pathname: string, search: string) {
  return pathname === routes.home ? routes.setups : `${pathname}${search}`;
}

export function buildLoginRedirectPath(pathname: string, search: string) {
  const loginUrl = new URL(routes.login, 'https://app.local');
  loginUrl.searchParams.set(authRedirectParam, buildPostLoginRedirectTarget(pathname, search));

  return `${loginUrl.pathname}${loginUrl.search}`;
}
