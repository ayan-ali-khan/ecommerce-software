'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Loader2, MessageCircle, Phone } from 'lucide-react';
import { orderStatusUpdateSchema, type OrderStatusUpdate } from '@/lib/validators/order';
import type { AdminOrderDetail } from '@/lib/queries/admin-orders';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge, STATUS_LABELS } from './status';

async function fetchOrder(id: string): Promise<AdminOrderDetail> {
  const res = await fetch(`/api/admin/orders/${id}`);
  const json = (await res.json().catch(() => null)) as {
    success: boolean;
    data?: AdminOrderDetail;
    error?: { message?: string };
  } | null;
  if (!res.ok || !json?.success || !json.data) {
    throw new Error(json?.error?.message ?? 'Failed to load order');
  }
  return json.data;
}

async function patchOrder(id: string, input: OrderStatusUpdate): Promise<AdminOrderDetail> {
  const res = await fetch(`/api/admin/orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const json = (await res.json().catch(() => null)) as {
    success: boolean;
    data?: AdminOrderDetail;
    error?: { message?: string };
  } | null;
  if (!res.ok || !json?.success || !json.data) {
    throw new Error(json?.error?.message ?? 'Failed to update order');
  }
  return json.data;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function customerWaLink(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? `https://wa.me/${digits}` : null;
}

export function OrderDetailView({ id }: { id: string }) {
  const query = useQuery({ queryKey: ['admin-order', id], queryFn: () => fetchOrder(id) });

  if (query.isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading order">
        <div className="h-7 w-48 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded-lg border bg-muted/40" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="space-y-4">
        <div
          className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm"
          role="alert"
        >
          {(query.error as Error)?.message ?? 'Order not found'}
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/orders">
            <ArrowLeft aria-hidden="true" /> Back to orders
          </Link>
        </Button>
      </div>
    );
  }

  const order = query.data;
  const waLink = customerWaLink(order.customer.phone);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" aria-label="Back to orders">
            <Link href="/admin/orders">
              <ArrowLeft aria-hidden="true" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tabular-nums">{order.orderNumber}</h1>
          <StatusBadge status={order.status} />
        </div>
        <p className="text-sm text-muted-foreground">Placed {formatDate(order.createdAt)}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="rounded-lg border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Customer
            </h2>
            <p className="font-medium">{order.customer.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
              <a
                href={`tel:${order.customer.phone.replace(/[^\d+]/g, '')}`}
                className="inline-flex items-center gap-1.5 font-medium tabular-nums hover:underline"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                {order.customer.phone}
              </a>
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#128C7E] hover:underline"
                >
                  <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  WhatsApp customer
                </a>
              )}
              {order.customer.email && (
                <a
                  href={`mailto:${order.customer.email}`}
                  className="text-muted-foreground hover:underline"
                >
                  {order.customer.email}
                </a>
              )}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {order.customer.address}, {order.customer.city} — {order.customer.pincode}
            </p>
            {order.customer.notes && (
              <blockquote className="mt-3 rounded-md border border-dashed p-3 text-sm">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Customer note:{' '}
                </span>
                {order.customer.notes}
              </blockquote>
            )}
          </section>

          <section className="rounded-lg border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Items
            </h2>
            <ul className="divide-y text-sm">
              {order.items.map((item, index) => (
                <li
                  key={`${item.productId}-${index}`}
                  className="flex justify-between gap-4 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.variant}</span>
                  </span>
                  <span className="shrink-0 text-right tabular-nums text-muted-foreground">
                    {item.qty} × {formatPrice(item.price)}
                    <span className="block font-semibold text-foreground">
                      {formatPrice(item.price * item.qty)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t pt-3 text-sm font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatPrice(order.total)}</span>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <StatusEditor order={order} />

          <section className="rounded-lg border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Status history
            </h2>
            <ol className="space-y-3">
              {[...order.statusHistory].reverse().map((entry, index) => (
                <li key={`${entry.status}-${entry.at}-${index}`} className="flex gap-3 text-sm">
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                  <span>
                    <span className="font-medium">
                      {STATUS_LABELS[entry.status as keyof typeof STATUS_LABELS] ?? entry.status}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {formatDate(entry.at)}
                    </span>
                    {entry.note && <span className="block text-xs italic">{entry.note}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatusEditor({ order }: { order: AdminOrderDetail }) {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrderStatusUpdate>({
    resolver: zodResolver(orderStatusUpdateSchema),
    defaultValues: {
      status: order.status,
      note: '',
      internalNotes: order.internalNotes,
    },
  });

  const mutation = useMutation({
    mutationFn: (input: OrderStatusUpdate) => patchOrder(order.id, input),
    onSuccess: (data) => {
      queryClient.setQueryData(['admin-order', order.id], data);
      void queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      reset({
        status: data.status,
        note: '',
        internalNotes: data.internalNotes,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    },
  });

  const onSubmit = handleSubmit((values) => {
    setSaved(false);
    mutation.mutate({
      status: values.status,
      ...(values.note ? { note: values.note } : {}),
      ...(values.internalNotes !== undefined ? { internalNotes: values.internalNotes } : {}),
    });
  });

  return (
    <section className="rounded-lg border bg-card p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Update status
      </h2>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            {...register('status')}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {(Object.keys(STATUS_LABELS) as (keyof typeof STATUS_LABELS)[]).map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
          {errors.status && (
            <p className="text-xs text-destructive" role="alert">
              {errors.status.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="note">History note (optional)</Label>
          <Textarea
            id="note"
            rows={2}
            placeholder="e.g. Called customer, confirmed UPI payment"
            {...register('note')}
          />
          {errors.note && (
            <p className="text-xs text-destructive" role="alert">
              {errors.note.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="internalNotes">Private notes (never shown to customer)</Label>
          <Textarea
            id="internalNotes"
            rows={3}
            placeholder="e.g. Prefers evening delivery, gate code 45B"
            {...register('internalNotes')}
          />
          {errors.internalNotes && (
            <p className="text-xs text-destructive" role="alert">
              {errors.internalNotes.message}
            </p>
          )}
        </div>

        {mutation.isError && (
          <p className="text-sm text-destructive" role="alert">
            {(mutation.error as Error).message}
          </p>
        )}
        {saved && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-600" role="status">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Update saved
          </p>
        )}

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
          Save update
        </Button>
      </form>
    </section>
  );
}
