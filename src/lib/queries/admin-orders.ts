/** Admin-facing order queries: list with filters, detail, status transitions. */
import { connectDB } from '@/lib/db';
import { Order } from '@/models';
import { ORDER_STATUSES, type OrderStatus } from '@/lib/validators';
import type { OrderStatusUpdate } from '@/lib/validators/order';

export interface AdminOrderListItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  customerName: string;
  customerPhone: string;
  createdAt: string;
}

export interface AdminOrdersResult {
  items: AdminOrderListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statusCounts: Record<string, number>;
}

export interface AdminOrderDetail {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  source: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    pincode: string;
    notes: string;
  };
  items: { productId: string; name: string; variant: string; price: number; qty: number }[];
  statusHistory: { status: string; at: string; note?: string }[];
  /** Private owner notes — never shown to the customer. */
  internalNotes: string;
  createdAt: string;
  updatedAt: string;
}

type LeanOrder = {
  _id: unknown;
  orderNumber: string;
  status?: OrderStatus;
  total: number;
  source?: string;
  customer: AdminOrderDetail['customer'];
  items: {
    productId?: unknown;
    name: string;
    variant: string;
    price: number;
    qty: number;
  }[];
  statusHistory?: { status: string; at: Date | string; note?: string | null }[];
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

function iso(value: Date | string | undefined, fallback = new Date()): string {
  return value ? new Date(value).toISOString() : fallback.toISOString();
}

function toListItem(order: LeanOrder): AdminOrderListItem {
  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    status: order.status ?? 'pending',
    total: order.total,
    itemCount: (order.items ?? []).reduce((sum, item) => sum + item.qty, 0),
    customerName: order.customer?.name ?? '',
    customerPhone: order.customer?.phone ?? '',
    createdAt: iso(order.createdAt),
  };
}

function toDetail(order: LeanOrder): AdminOrderDetail {
  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    status: order.status ?? 'pending',
    total: order.total,
    source: order.source ?? 'website',
    customer: {
      name: order.customer?.name ?? '',
      phone: order.customer?.phone ?? '',
      email: order.customer?.email ?? '',
      address: order.customer?.address ?? '',
      city: order.customer?.city ?? '',
      pincode: order.customer?.pincode ?? '',
      notes: order.customer?.notes ?? '',
    },
    items: (order.items ?? []).map((item) => ({
      productId: String(item.productId ?? ''),
      name: item.name,
      variant: item.variant,
      price: item.price,
      qty: item.qty,
    })),
    statusHistory: (order.statusHistory ?? []).map((entry) => ({
      status: entry.status,
      at: iso(entry.at),
      ...(entry.note ? { note: entry.note } : {}),
    })),
    internalNotes: order.notes ?? '',
    createdAt: iso(order.createdAt),
    updatedAt: iso(order.updatedAt, order.createdAt ?? new Date()),
  };
}

export async function listAdminOrders({
  status,
  page,
  limit,
}: {
  status?: OrderStatus;
  page: number;
  limit: number;
}): Promise<AdminOrdersResult> {
  await connectDB();
  const filter = status ? { status } : {};

  const [total, docs, grouped] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.aggregate<{ _id: OrderStatus; count: number }>([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const statusCounts: Record<string, number> = { all: total };
  for (const value of ORDER_STATUSES) statusCounts[value] = 0;
  for (const group of grouped) {
    if (group._id in statusCounts) statusCounts[group._id] = group.count;
  }

  return {
    items: (docs as unknown as LeanOrder[]).map(toListItem),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    statusCounts,
  };
}

export async function getAdminOrder(id: string): Promise<AdminOrderDetail | null> {
  await connectDB();
  const order = await Order.findById(id).lean();
  if (!order) return null;
  return toDetail(order as unknown as LeanOrder);
}

/** Applies a status transition + history entry; optional internal notes overwrite. */
export async function updateAdminOrder(
  id: string,
  update: OrderStatusUpdate,
): Promise<AdminOrderDetail | null> {
  await connectDB();

  const set: Record<string, unknown> = { status: update.status };
  if (update.internalNotes !== undefined) set.notes = update.internalNotes;

  const order = await Order.findByIdAndUpdate(
    id,
    {
      $set: set,
      $push: {
        statusHistory: {
          status: update.status,
          at: new Date(),
          ...(update.note ? { note: update.note } : {}),
        },
      },
    },
    { new: true },
  ).lean();

  if (!order) return null;
  return toDetail(order as unknown as LeanOrder);
}
