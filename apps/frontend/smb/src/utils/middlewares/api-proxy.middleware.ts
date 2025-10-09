import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function apiProxyMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  // Create a new request to actual backend API
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';
  // Extract the relative path after '/api/proxy/'
  const path = request.nextUrl.pathname.replace('/api/proxy', '');
  const url = new URL(path, apiUrl);
  // Copy query parameters
  url.search = request.nextUrl.search;

  // auth endpoints
  if (pathname.startsWith('/api/proxy/v1/auth')) {
    // Special handling for logout endpoint - it requires authentication
    if (pathname === '/api/proxy/v1/auth/logout') {
      const sessionJwt = request.cookies.get('orbbit_smb_session_jwt')?.value;
      if (!sessionJwt) {
        return NextResponse.json(
          { error: 'No session found' },
          { status: 401 }
        );
      }
      const headers = new Headers(request.headers);
      headers.set('Authorization', `Bearer ${sessionJwt}`);
      return NextResponse.rewrite(url, {
        request: {
          headers,
        },
      });
    }
    // Other auth endpoints don't need authentication (login, signup, OTP)
    return NextResponse.rewrite(url);
  } else {
    const sessionJwt = request.cookies.get('orbbit_smb_session_jwt')?.value;
    if (!sessionJwt) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
    const headers = new Headers(request.headers);
    headers.set('Authorization', `Bearer ${sessionJwt}`);
    return NextResponse.rewrite(url, {
      request: {
        headers,
      },
    });
  }
}

// Specify which paths this middleware should run on
export const config = {
  matcher: '/api/proxy/:path*',
};
