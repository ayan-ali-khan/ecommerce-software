import { NextResponse, type NextResponse as NextRes } from 'next/server';
import { ZodError } from 'zod';

/**
 * Centralised JSON helpers + error handler.
 * Every API route responds with the same envelope:
 *   success: { success: true, data }
 *   failure: { success: false, error: { code, message, details? } }
 */

export function apiSuccess<T>(data: T, status = 200): NextRes {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: unknown,
): NextRes {
  return NextResponse.json(
    { success: false, error: { code, message, ...(details !== undefined ? { details } : {}) } },
    { status },
  );
}

/** Maps thrown errors to consistent HTTP responses. Validation → 400, everything else → 500. */
export function handleApiError(err: unknown): NextRes {
  if (err instanceof ZodError) {
    return apiError('VALIDATION_ERROR', 'Invalid request', 400, err.issues);
  }
  console.error('[api] Unhandled error:', err);
  return apiError('INTERNAL_ERROR', 'Something went wrong. Please try again.', 500);
}
