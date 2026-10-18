import { NextResponse } from 'next/server';
import { apiSuccess } from '@/lib/api';
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth/session';

/** Clears the session cookie. Safe to call unauthenticated. */
export async function POST(): Promise<NextResponse> {
  const res = apiSuccess({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions, maxAge: 0 });
  return res;
}
