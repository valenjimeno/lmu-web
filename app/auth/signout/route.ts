import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { routes } from '@/lib/constants/routes';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.auth.signOut();
  }

  revalidatePath('/', 'layout');

  return NextResponse.redirect(new URL(routes.login, request.url), {
    status: 302,
  });
}
