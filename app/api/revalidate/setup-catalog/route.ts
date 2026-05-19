import { NextResponse, type NextRequest } from 'next/server';
import { revalidateSetupCatalog } from '@/services/catalog.service';

function isAuthorized(request: NextRequest) {
  const secret = process.env.CACHE_REVALIDATE_SECRET;

  if (!secret) {
    return false;
  }

  const authorization = request.headers.get('authorization');
  const bearerToken = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : null;
  const headerToken = request.headers.get('x-revalidate-secret')?.trim();

  return bearerToken === secret || headerToken === secret;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        revalidated: false,
        message: 'Unauthorized',
      },
      { status: 401 },
    );
  }

  revalidateSetupCatalog();

  return NextResponse.json({
    revalidated: true,
    tag: 'setup-catalog',
    timestamp: new Date().toISOString(),
  });
}
