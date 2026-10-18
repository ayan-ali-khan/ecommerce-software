import { NextResponse, type NextResponse as NextRes } from 'next/server';
import { apiError, apiSuccess, handleApiError } from '@/lib/api';
import { requireAdmin } from '@/lib/auth/guard';
import { objectIdSchema, orderStatusUpdateSchema } from '@/lib/validators';
import { getAdminOrder, updateAdminOrder } from '@/lib/queries/admin-orders';

export const dynamic = 'force-dynamic';

async function resolveId(context: { params: Promise<{ id: string }> }): Promise<string | null> {
  const { id } = await context.params;
  const parsed = objectIdSchema.safeParse(id.trim());
  return parsed.success ? parsed.data : null;
}

/** GET /api/admin/orders/[id] — full order detail (incl. customer + history). */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextRes> {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const id = await resolveId(context);
    if (!id) return apiError('VALIDATION_ERROR', 'Invalid order id', 400);

    const order = await getAdminOrder(id);
    if (!order) return apiError('NOT_FOUND', 'Order not found', 404);
    return apiSuccess(order);
  } catch (err) {
    return handleApiError(err);
  }
}

/** PATCH /api/admin/orders/[id] — status transition (+ history entry, internal notes). */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextRes> {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const id = await resolveId(context);
    if (!id) return apiError('VALIDATION_ERROR', 'Invalid order id', 400);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError('VALIDATION_ERROR', 'Invalid JSON body', 400);
    }

    const parsed = orderStatusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid request', 400, parsed.error.issues);
    }

    const order = await updateAdminOrder(id, parsed.data);
    if (!order) return apiError('NOT_FOUND', 'Order not found', 404);
    return apiSuccess(order);
  } catch (err) {
    return handleApiError(err);
  }
}
