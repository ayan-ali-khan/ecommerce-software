import { SignJWT, jwtVerify } from 'jose';

/**
 * Admin session: signed JWT (HS256, jose) delivered in an httpOnly cookie.
 * Edge-safe (used by middleware) — no Node-only APIs.
 */
export const SESSION_COOKIE = 'admin_session';
const SESSION_DAYS = 7;

export interface SessionPayload {
  sub: string;
  email: string;
  role: 'admin';
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'AUTH_SECRET is missing or too short. Copy .env.example to .env.local and set it (min 16 chars).',
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());
}

/** Verifies signature + expiry + claims. Returns null for any invalid token. */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });
    if (
      payload.role !== 'admin' ||
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string'
    ) {
      return null;
    }
    return { sub: payload.sub, email: payload.email, role: 'admin' };
  } catch {
    return null;
  }
}

/** Cookie attributes for the session. httpOnly: JS can never read the token. */
export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_DAYS * 24 * 60 * 60,
} as const;
