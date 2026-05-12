import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json(
        {
          status: 'error',
          initialized: true,
          authenticated: false,
          message: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      status: 'ok',
      initialized: true,
      authenticated: Boolean(session),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        initialized: false,
        authenticated: false,
        message: error instanceof Error ? error.message : 'Unknown Supabase error',
      },
      { status: 500 },
    );
  }
}
