import { type NextRequest, NextResponse } from 'next/server';
import { apiProxyMiddleware } from '@/utils/middlewares/api-proxy.middleware';
import { authMiddleware } from '@/utils/middlewares/auth.middleware';

export async function middleware(request: NextRequest) {
  // Only run proxy logic for /api/proxy/*
  //   if (request.nextUrl.pathname.startsWith('/api/proxy/')) {
  //     return await apiProxyMiddleware(request);
  //   } else {
  //     const authResult = await authMiddleware(request);
  //     if (authResult.status !== 200 || authResult.headers.has('Location')) {
  //       return authResult;
  //     }
  //     return NextResponse.next();
  //   }
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
