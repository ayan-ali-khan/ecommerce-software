import { NextResponse } from 'next/server';
import { apiError, apiSuccess, handleApiError } from '@/lib/api';
import { adminLoginSchema } from '@/lib/validators/admin';
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth/session';
import { verifyAdminCredentials } from '@/lib/queries/admin-auth';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/** 10 attempts / 15 min / IP — brute-force protection. */
const RATE = { limit: 10, windowMs: 15 * 60_000 } as const;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const rl = rateLimit(`admin:login:${getClientIp(request)}`, RATE);
    if (!rl.ok) {
      return apiError('RATE_LIMITED', 'Too many login attempts. Please wait and try again.', 429, {
        retryAfterSeconds: rl.retryAfterSeconds,
      });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError('VALIDATION_ERROR', 'Invalid JSON body', 400);
    }

    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid request', 400, parsed.error.issues);
    }

    const admin = await verifyAdminCredentials(parsed.data.email, parsed.data.password);
    if (!admin) {
      return apiError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const token = await createSessionToken({
      sub: admin.id,
      email: admin.email,
      role: 'admin',
    });
    const res = apiSuccess({ email: admin.email });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  } catch (err) {
    return handleApiError(err);
  }
}
