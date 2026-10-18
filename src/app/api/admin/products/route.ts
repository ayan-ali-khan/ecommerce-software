import { NextResponse, type NextResponse as NextRes } from 'next/server';
import { apiError, apiSuccess, handleApiError } from '@/lib/api';
import { requireAdmin } from '@/lib/auth/guard';
import { adminProductListQuerySchema } from '@/lib/validators/admin';
import { productInputSchema } from '@/lib/validators/product';
import { createAdminProduct, listAdminProducts } from '@/lib/queries/admin-products';

export const dynamic = 'force-dynamic';

/** GET /api/admin/products?q=&category=&includeDeleted=&page=&limit= — admin list. */
export async function GET(request: Request): Promise<NextRes> {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const params = Object.fromEntries(new URL(request.url).searchParams.entries());
    const parsed = adminProductListQuerySchema.safeParse(params);
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid query parameters', 400, parsed.error.issues);
    }

    const result = await listAdminProducts(parsed.data);
    return apiSuccess(result);
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST /api/admin/products — create a product (slug derived server-side). */
export async function POST(request: Request): Promise<NextRes> {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError('VALIDATION_ERROR', 'Invalid JSON body', 400);
    }

    const parsed = productInputSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid request', 400, parsed.error.issues);
    }

    const product = await createAdminProduct(parsed.data);
    return apiSuccess(product, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
