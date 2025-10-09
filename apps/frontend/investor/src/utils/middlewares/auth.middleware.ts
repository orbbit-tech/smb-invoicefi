import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function authMiddleware(
  request: NextRequest
): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const sessionJwt = request.cookies.get('orbbit_smb_session_jwt')?.value;

  // Allow access to the auth route for unauthenticated users
  const isAuthRoute = pathname === '/auth';

  if (!sessionJwt) {
    return isAuthRoute
      ? NextResponse.next()
      : NextResponse.redirect(new URL('/auth', request.url));
  }

  const decoded = jwt.decode(sessionJwt) as {
    'https://stytch.com/organization'?: {
      slug?: string;
    };
    [key: string]: unknown;
  } | null;

  const orgSlug = decoded?.['https://stytch.com/organization']?.slug;

  if (!orgSlug) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Redirect from auth to root (dashboard) if user is authenticated
  if (isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Allow all other routes for authenticated users
  // The Next.js App Router will handle 404s for non-existent routes
  return NextResponse.next();
}
