import { NextResponse, type NextResponse as NextRes } from 'next/server';
import { apiError, apiSuccess, handleApiError } from '@/lib/api';
import { requireAdmin } from '@/lib/auth/guard';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import {
  CloudinaryNotConfiguredError,
  UPLOAD_ALLOWED_TYPES,
  UPLOAD_MAX_BYTES,
  uploadImage,
} from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/uploads — multipart form upload (field name: "file").
 * Admin-only, rate-limited, type + size validated, signed server-side push
 * to Cloudinary. Returns { url, publicId, width, height }.
 */
export async function POST(request: Request): Promise<NextRes> {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const limit = rateLimit(`upload:${getClientIp(request)}`, {
      limit: 30,
      windowMs: 5 * 60 * 1000,
    });
    if (!limit.ok) {
      return apiError('RATE_LIMITED', 'Too many uploads. Try again shortly.', 429, {
        retryAfterSeconds: limit.retryAfterSeconds,
      });
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return apiError('VALIDATION_ERROR', 'Expected multipart form data with a "file" field', 400);
    }

    const file = form.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return apiError('VALIDATION_ERROR', 'No file provided', 400);
    }
    if (!(UPLOAD_ALLOWED_TYPES as readonly string[]).includes(file.type)) {
      return apiError(
        'VALIDATION_ERROR',
        'Unsupported file type. Use JPEG, PNG, WebP or AVIF.',
        400,
      );
    }
    if (file.size > UPLOAD_MAX_BYTES) {
      return apiError('VALIDATION_ERROR', 'Image too large (max 5 MB).', 400);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await uploadImage(bytes, file.type, { filename: file.name || 'image' });
    return apiSuccess(result);
  } catch (err) {
    if (err instanceof CloudinaryNotConfiguredError) {
      return apiError('UPLOAD_NOT_CONFIGURED', err.message, 503);
    }
    return handleApiError(err);
  }
}
