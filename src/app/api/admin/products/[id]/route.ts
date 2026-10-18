import { NextResponse, type NextResponse as NextRes } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess, handleApiError } from '@/lib/api';
import { requireAdmin } from '@/lib/auth/guard';
import { objectIdSchema } from '@/lib/validators';
import { productInputSchema } from '@/lib/validators/product';
import {
  getAdminProduct,
  setProductDeleted,
  updateAdminProduct,
} from '@/lib/queries/admin-products';

export const dynamic = 'force-dynamic';

/** Soft-delete / restore payload: DELETE body or PATCH { isDeleted }. */
const deleteToggleSchema = z.object({ isDeleted: z.boolean().default(true) });

async function resolveId(context: { params: Promise<{ id: string }> }): Promise<string | null> {
  const { id } = await context.params;
  const parsed = objectIdSchema.safeParse(id.trim());
  return parsed.success ? parsed.data : null;
}

/** GET /api/admin/products/[id] — full product detail for the edit form. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextRes> {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const id = await resolveId(context);
    if (!id) return apiError('VALIDATION_ERROR', 'Invalid product id', 400);

    const product = await getAdminProduct(id);
    if (!product) return apiError('NOT_FOUND', 'Product not found', 404);
    return apiSuccess(product);
  } catch (err) {
    return handleApiError(err);
  }
}

/** PATCH /api/admin/products/[id] — full update from the edit form. */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextRes> {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const id = await resolveId(context);
    if (!id) return apiError('VALIDATION_ERROR', 'Invalid product id', 400);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError('VALIDATION_ERROR', 'Invalid JSON body', 400);
    }

    // `{ isDeleted: boolean }` alone toggles soft-delete state (restore path).
    const toggle = deleteToggleSchema.safeParse(body);
    if (toggle.success && Object.keys(body as object).length === 1) {
      const product = await setProductDeleted(id, toggle.data.isDeleted);
      if (!product) return apiError('NOT_FOUND', 'Product not found', 404);
      return apiSuccess(product);
    }

    const parsed = productInputSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid request', 400, parsed.error.issues);
    }

    const product = await updateAdminProduct(id, parsed.data);
    if (!product) return apiError('NOT_FOUND', 'Product not found', 404);
    return apiSuccess(product);
  } catch (err) {
    return handleApiError(err);
  }
}

/** DELETE /api/admin/products/[id] — soft delete (product stays in the DB). */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextRes> {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const id = await resolveId(context);
    if (!id) return apiError('VALIDATION_ERROR', 'Invalid product id', 400);

    const product = await setProductDeleted(id, true);
    if (!product) return apiError('NOT_FOUND', 'Product not found', 404);
    return apiSuccess(product);
  } catch (err) {
    return handleApiError(err);
  }
}
