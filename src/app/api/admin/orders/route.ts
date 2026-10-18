import { NextResponse, type NextResponse as NextRes } from 'next/server';
import { apiError, apiSuccess, handleApiError } from '@/lib/api';
import { requireAdmin } from '@/lib/auth/guard';
import { adminOrderListQuerySchema } from '@/lib/validators/admin';
import { listAdminOrders } from '@/lib/queries/admin-orders';

export const dynamic = 'force-dynamic';

/** GET /api/admin/orders?status=&page=&limit= — paginated list + status counts. */
export async function GET(request: Request): Promise<NextRes> {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const params = Object.fromEntries(new URL(request.url).searchParams.entries());
    const parsed = adminOrderListQuerySchema.safeParse(params);
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid query parameters', 400, parsed.error.issues);
    }

    const result = await listAdminOrders(parsed.data);
    return apiSuccess(result);
  } catch (err) {
    return handleApiError(err);
  }
}
