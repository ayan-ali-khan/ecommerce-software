import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session';

/**
 * Page-level guard for /admin/**. Tokens are verified (not just present);
 * unauthenticated users land on /admin/login with a `next` redirect.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // Already logged in? Keep /admin/login out of the way.
  if (pathname === '/admin/login') {
    if (session) {
      const next = request.nextUrl.searchParams.get('next');
      const target = next && next.startsWith('/') && !next.startsWith('//') ? next : '/admin';
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL('/admin/login', request.url);
    const next = `${pathname}${search}`;
    if (next !== '/admin') loginUrl.searchParams.set('next', next);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
