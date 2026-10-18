import { NextResponse, type NextResponse as NextRes } from 'next/server';
import { apiError, apiSuccess, handleApiError } from '@/lib/api';
import { requireAdmin } from '@/lib/auth/guard';
import { settingsInputSchema } from '@/lib/validators/settings';
import type { SettingsInput } from '@/lib/validators/settings';
import { getSettings, updateSettings } from '@/lib/queries/settings';

export const dynamic = 'force-dynamic';

/** GET /api/admin/settings — full settings doc (owner only). */
export async function GET(): Promise<NextRes> {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const settings = await getSettings();
    return apiSuccess(settings);
  } catch (err) {
    return handleApiError(err);
  }
}

/** PATCH /api/admin/settings — owner edits store settings. */
export async function PATCH(request: Request): Promise<NextRes> {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError('VALIDATION_ERROR', 'Invalid JSON body', 400);
    }

    const parsed = settingsInputSchema.partial().safeParse(body);
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid request', 400, parsed.error.issues);
    }

    const settings = await updateSettings(parsed.data as SettingsInput);
    return apiSuccess(settings);
  } catch (err) {
    return handleApiError(err);
  }
}
