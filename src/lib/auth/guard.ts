import { cookies } from 'next/headers';
import { apiError } from '@/lib/api';
import type { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken, type SessionPayload } from './session';

/** Reads + verifies the session cookie (route handlers / server components). */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Guard for admin API handlers: returns the session or a 401 response.
 * Usage: `const auth = await requireAdmin(); if (auth instanceof NextResponse) return auth;`
 */
export async function requireAdmin(): Promise<SessionPayload | NextResponse> {
  const session = await getSession();
  if (!session) return apiError('UNAUTHORIZED', 'Admin authentication required', 401);
  return session;
}
