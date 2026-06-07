import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/comparison/:path*',
    '/setups/:path*',
    '/sesiones/:path*',
    '/profile/:path*',
    '/equipos/:path*',
    '/login',
  ],
};
