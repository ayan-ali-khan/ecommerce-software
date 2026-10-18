import { type NextResponse as NextRes } from 'next/server';
import { apiSuccess, handleApiError } from '@/lib/api';
import { getPublicSettings } from '@/lib/queries/settings';

export const dynamic = 'force-dynamic';

/**
 * Public GET /api/settings — owner-editable store settings for the storefront.
 * No auth required. Used by client components that need owner overrides (store name,
 * WhatsApp, phone, shipping note) with env fallback when settings are unset.
 */
export async function GET(): Promise<NextRes> {
  try {
    const settings = await getPublicSettings();
    return apiSuccess(settings);
  } catch (err) {
    return handleApiError(err);
  }
}
