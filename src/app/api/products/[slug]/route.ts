import { NextResponse } from 'next/server';
import { apiError, apiSuccess, handleApiError } from '@/lib/api';
import { getProductBySlug } from '@/lib/queries/products';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products/[slug]
 * Single product by slug (soft-deleted products are hidden).
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  try {
    const { slug } = await context.params;
    const product = await getProductBySlug(decodeURIComponent(slug));
    if (!product) {
      return apiError('NOT_FOUND', 'Product not found', 404);
    }
    return apiSuccess(product);
  } catch (err) {
    return handleApiError(err);
  }
}
