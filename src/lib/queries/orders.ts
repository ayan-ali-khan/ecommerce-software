/**
 * Server-side order creation: recompute prices from the DB, verify stock,
 * generate the order number and persist. Client prices are NEVER trusted.
 */
import { connectDB } from '@/lib/db';
import { Order, Product } from '@/models';
import type { CheckoutInput, OrderItemInput, OrderStatus } from '@/lib/validators';

const ORDER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

/** Human-friendly, unguessable order number (8 chars ≈ 32 bits of entropy). */
export function generateOrderNumber(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const byte of bytes) out += ORDER_ALPHABET[byte % ORDER_ALPHABET.length];
  return `BB-${out}`;
}

/** Domain error with a safe HTTP mapping (code, message, status). */
export class OrderError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'OrderError';
  }
}

export interface CreatedOrder {
  orderNumber: string;
  total: number;
  status: OrderStatus;
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    pincode: string;
    notes: string;
  };
  items: { name: string; variant: string; qty: number; price: number }[];
  placedAt: Date;
}

type CreateOrderInput = {
  customer: CheckoutInput['customer'];
  items: OrderItemInput[];
};

export async function createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
  await connectDB();

  // Merge duplicate product+variant lines so stock checks and totals stay correct.
  const merged = new Map<string, OrderItemInput>();
  for (const item of input.items) {
    const key = `${item.productId}::${item.variantLabel}`;
    const existing = merged.get(key);
    if (existing) existing.qty += item.qty;
    else merged.set(key, { ...item });
  }
  const lines = [...merged.values()];
  if (lines.some((line) => line.qty > 50)) {
    throw new OrderError('VALIDATION_ERROR', 'Quantity per item cannot exceed 50.', 400);
  }

  const productIds = [...new Set(lines.map((line) => line.productId))];
  const products = await Product.find({ _id: { $in: productIds }, isDeleted: false }).lean();

  interface ResolvedItem {
    productId: unknown;
    name: string;
    variant: string;
    price: number;
    qty: number;
  }
  const resolved: ResolvedItem[] = [];
  const issues: { item: string; reason: string }[] = [];

  for (const line of lines) {
    const product = products.find((p) => String(p._id) === line.productId);
    if (!product) {
      issues.push({ item: line.variantLabel, reason: 'no longer available' });
      continue;
    }
    const variant = product.variants.find((v) => v.label === line.variantLabel);
    if (!variant) {
      issues.push({
        item: `${product.name} (${line.variantLabel})`,
        reason: 'variant no longer offered',
      });
      continue;
    }
    const stock = variant.stockQty ?? 0;
    if (!product.inStock || stock < line.qty) {
      issues.push({
        item: `${product.name} (${variant.label})`,
        reason: stock === 0 ? 'out of stock' : `only ${stock} left`,
      });
      continue;
    }
    resolved.push({
      productId: product._id,
      name: product.name,
      variant: variant.label,
      price: variant.price,
      qty: line.qty,
    });
  }

  if (issues.length > 0) {
    throw new OrderError(
      'ITEMS_UNAVAILABLE',
      'Some items in your cart are no longer available or are out of stock. Please review your cart.',
      409,
      { issues },
    );
  }

  // Prices come from the DB only.
  const total = resolved.reduce((sum, item) => sum + item.price * item.qty, 0);
  const placedAt = new Date();
  const customer = {
    name: input.customer.name,
    phone: input.customer.phone,
    email: input.customer.email ?? '',
    address: input.customer.address,
    city: input.customer.city,
    pincode: input.customer.pincode,
    notes: input.customer.notes ?? '',
  };

  // Reserve stock atomically — guards against concurrent orders racing past
  // the availability check above. Any failure rolls back every reservation,
  // so stock levels never drift.
  const reserved: ReservedLine[] = [];
  try {
    for (const item of resolved) {
      const ok = await reserveStock(item.productId, item.variant, item.qty);
      if (!ok) {
        throw new OrderError(
          'ITEMS_UNAVAILABLE',
          'Some items just sold out. Please review your cart.',
          409,
          { issues: [{ item: `${item.name} (${item.variant})`, reason: 'just sold out' }] },
        );
      }
      reserved.push({ productId: item.productId, variantLabel: item.variant, qty: item.qty });
    }

    // Insert, retrying on the (very unlikely) orderNumber collision.
    let createdNumber: string | null = null;
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const candidate = generateOrderNumber();
        await Order.create({
          orderNumber: candidate,
          customer,
          items: resolved,
          total,
          status: 'pending',
          statusHistory: [{ status: 'pending', at: placedAt }],
          source: 'website',
        });
        createdNumber = candidate;
        break;
      } catch (err) {
        lastError = err;
        const code = (err as { code?: unknown }).code;
        if (code !== 11000) throw err; // duplicate key → retry, anything else → bubble up
      }
    }
    if (createdNumber === null) throw lastError;

    // Order persisted — hide products whose variants all hit zero stock
    // (best-effort: flag failure must never fail a placed order).
    for (const productId of new Set(resolved.map((item) => item.productId))) {
      try {
        await refreshOutOfStockFlag(productId);
      } catch (err) {
        console.error('[orders] failed to refresh inStock flag:', err);
      }
    }

    return {
      orderNumber: createdNumber,
      total,
      status: 'pending',
      customer,
      items: resolved.map(({ name, variant, qty, price }) => ({ name, variant, qty, price })),
      placedAt,
    };
  } catch (err) {
    await releaseStock(reserved);
    throw err;
  }
}

interface ReservedLine {
  productId: unknown;
  variantLabel: string;
  qty: number;
}

/** Conditional, atomic decrement — succeeds only if stock is still available. */
async function reserveStock(
  productId: unknown,
  variantLabel: string,
  qty: number,
): Promise<boolean> {
  const result = await Product.updateOne(
    {
      _id: productId,
      isDeleted: false,
      variants: { $elemMatch: { label: variantLabel, stockQty: { $gte: qty } } },
    },
    { $inc: { 'variants.$.stockQty': -qty } },
  );
  return result.modifiedCount === 1;
}

/** Compensating rollback when order creation fails after reserving (best-effort). */
async function releaseStock(reserved: ReservedLine[]): Promise<void> {
  for (const line of reserved) {
    try {
      await Product.updateOne(
        { _id: line.productId, variants: { $elemMatch: { label: line.variantLabel } } },
        { $inc: { 'variants.$.stockQty': line.qty } },
      );
    } catch (err) {
      console.error('[orders] stock rollback failed:', err, line);
    }
  }
}

/** Hides a product once every variant has zero stock (never re-shown automatically). */
async function refreshOutOfStockFlag(productId: unknown): Promise<void> {
  const product = await Product.findById(productId, {
    inStock: 1,
    'variants.stockQty': 1,
  }).lean();
  if (!product || product.inStock === false) return;
  const anyInStock = product.variants.some((v) => (v.stockQty ?? 0) > 0);
  if (!anyInStock) {
    await Product.updateOne({ _id: productId }, { $set: { inStock: false } });
  }
}

/** Lookup for the public order confirmation page (orderNumber is unique + high-entropy). */
export async function getOrderByNumber(orderNumber: string): Promise<{
  orderNumber: string;
  total: number;
  status: OrderStatus;
  items: { name: string; variant: string; qty: number; price: number }[];
} | null> {
  await connectDB();
  const order = await Order.findOne({ orderNumber }).lean();
  if (!order) return null;
  return {
    orderNumber: order.orderNumber,
    total: order.total,
    status: order.status ?? 'pending',
    items: (order.items ?? []).map((item) => ({
      name: item.name,
      variant: item.variant,
      qty: item.qty,
      price: item.price,
    })),
  };
}
