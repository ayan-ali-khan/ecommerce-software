import { NextResponse } from 'next/server';
import { apiError, apiSuccess, handleApiError } from '@/lib/api';
import { absoluteUrl, STORE } from '@/lib/store';
import { checkoutSchema } from '@/lib/validators';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { createOrder, generateOrderNumber, OrderError } from '@/lib/queries/orders';
import { getPublicSettings } from '@/lib/queries/settings';
import { notifyNewOrder, type NewOrderEvent } from '@/lib/notify';

export const dynamic = 'force-dynamic';

/** 15 attempts / 5 minutes / IP — blunts bots without annoying real customers. */
const RATE = { limit: 15, windowMs: 5 * 60_000 } as const;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`orders:create:${ip}`, RATE);
    if (!rl.ok) {
      return apiError(
        'RATE_LIMITED',
        'Too many order attempts. Please wait a few minutes or order on WhatsApp.',
        429,
        { retryAfterSeconds: rl.retryAfterSeconds },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError('VALIDATION_ERROR', 'Invalid JSON body', 400);
    }

    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid request', 400, parsed.error.issues);
    }

    const { customer, items, website } = parsed.data;

    // Honeypot: a bot filled the hidden field. Answer with a plausible success
    // so it learns nothing, but persist nothing.
    if (website && website.trim().length > 0) {
      return apiSuccess(
        {
          orderNumber: generateOrderNumber(),
          total: 0,
          itemCount: 0,
          placedAt: new Date().toISOString(),
        },
        201,
      );
    }

    const order = await createOrder({ customer, items });
    const settings = await getPublicSettings().catch(() => null);

    // Notification failure must never fail the order (notifyNewOrder never throws).
    const event: NewOrderEvent = {
      orderNumber: order.orderNumber,
      total: order.total,
      itemCount: order.items.length,
      status: order.status,
      customer: order.customer,
      items: order.items,
      placedAt: order.placedAt.toISOString(),
      storeName: settings?.storeName ?? STORE.name,
      orderUrl: absoluteUrl(`/orders/${order.orderNumber}`),
    };
    await notifyNewOrder(event);

    return apiSuccess(
      {
        orderNumber: order.orderNumber,
        total: order.total,
        itemCount: order.items.length,
        placedAt: order.placedAt.toISOString(),
      },
      201,
    );
  } catch (err) {
    if (err instanceof OrderError) {
      return apiError(err.code, err.message, err.status, err.details);
    }
    return handleApiError(err);
  }
}
