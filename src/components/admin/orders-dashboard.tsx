'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Inbox, RefreshCw } from 'lucide-react';
import { ORDER_STATUSES, type OrderStatus } from '@/lib/validators';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { StatusBadge, STATUS_LABELS } from './status';
import type { AdminOrdersResult } from '@/lib/queries/admin-orders';

type Tab = 'all' | OrderStatus;
const TABS: Tab[] = ['all', ...ORDER_STATUSES];
const PAGE_SIZE = 20;

async function fetchOrders(status: Tab, page: number): Promise<AdminOrdersResult> {
  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (status !== 'all') params.set('status', status);
  const res = await fetch(`/api/admin/orders?${params}`);
  const json = (await res.json().catch(() => null)) as {
    success: boolean;
    data?: AdminOrdersResult;
    error?: { message?: string };
  } | null;
  if (!res.ok || !json?.success || !json.data) {
    throw new Error(json?.error?.message ?? 'Failed to load orders');
  }
  return json.data;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function OrdersDashboard() {
  const [status, setStatus] = useState<Tab>('all');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['admin-orders', status, page],
    queryFn: () => fetchOrders(status, page),
  });

  function selectTab(tab: Tab) {
    setStatus(tab);
    setPage(1);
  }

  const data = query.data;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.total} order${data.total === 1 ? '' : 's'} total` : 'Loading…'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
          aria-label="Refresh orders"
        >
          <RefreshCw className={query.isFetching ? 'animate-spin' : undefined} aria-hidden="true" />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by status">
        {TABS.map((tab) => {
          const count = data?.statusCounts?.[tab];
          const active = status === tab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectTab(tab)}
              className={
                active
                  ? 'rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground'
                  : 'rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground'
              }
            >
              {tab === 'all' ? 'All' : STATUS_LABELS[tab]}
              {count !== undefined && (
                <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {query.isLoading && (
        <div className="space-y-2" aria-busy="true" aria-label="Loading orders">
          {[0, 1, 2].map((row) => (
            <div key={row} className="h-16 animate-pulse rounded-lg border bg-muted/40" />
          ))}
        </div>
      )}

      {query.isError && (
        <div
          className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm"
          role="alert"
        >
          <span>{(query.error as Error).message}</span>
          <Button size="sm" variant="outline" onClick={() => query.refetch()}>
            Retry
          </Button>
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border bg-card py-14 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground" aria-hidden="true" />{' '}
          <p className="font-medium">
            {status === 'all' ? 'No orders' : `No ${STATUS_LABELS[status].toLowerCase()} orders`}
          </p>
          <p className="text-sm text-muted-foreground">New website orders land here instantly.</p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="hidden grid-cols-[1.2fr_1.4fr_0.6fr_0.8fr_1fr_1.5rem] gap-4 border-b bg-muted/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid">
            <span>Order</span>
            <span>Customer</span>
            <span className="text-right">Items</span>
            <span className="text-right">Total</span>
            <span>Status</span>
            <span className="sr-only">Open</span>
          </div>
          <ul className="divide-y">
            {data.items.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="grid grid-cols-1 gap-1 px-4 py-3 transition-colors hover:bg-accent md:grid-cols-[1.2fr_1.4fr_0.6fr_0.8fr_1fr_1.5rem] md:items-center md:gap-4"
                >
                  <span className="font-medium tabular-nums">{order.orderNumber}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{order.customerName}</span>
                    <span className="block text-xs tabular-nums text-muted-foreground">
                      {order.customerPhone} · {formatDate(order.createdAt)}
                    </span>
                  </span>
                  <span className="text-sm tabular-nums md:text-right">{order.itemCount}</span>
                  <span className="text-sm font-semibold tabular-nums md:text-right">
                    {formatPrice(order.total)}
                  </span>
                  <span>
                    <StatusBadge status={order.status} />
                  </span>
                  <ChevronRight
                    className="hidden h-4 w-4 text-muted-foreground md:block"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || query.isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft aria-hidden="true" /> Prev
          </Button>
          <span className="text-sm tabular-nums text-muted-foreground">
            Page {data.page} of {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages || query.isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Next <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}
