import { NextResponse } from 'next/server';
import { apiError, apiSuccess, handleApiError } from '@/lib/api';
import { productListQuerySchema } from '@/lib/validators';
import { listProducts } from '@/lib/queries/products';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products?q=&category=&sort=&page=&limit=
 * Public product listing (search, filter, sort, pagination).
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const params = Object.fromEntries(new URL(request.url).searchParams.entries());
    const parsed = productListQuerySchema.safeParse(params);
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid query parameters', 400, parsed.error.issues);
    }

    const result = await listProducts(parsed.data);
    return apiSuccess(result);
  } catch (err) {
    return handleApiError(err);
  }
}
