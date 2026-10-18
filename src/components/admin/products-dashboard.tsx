'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Undo2,
} from 'lucide-react';
import { PRODUCT_CATEGORIES } from '@/lib/validators';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AdminProductListResult } from '@/lib/queries/admin-products';

const PAGE_SIZE = 20;

async function fetchProducts(params: {
  q: string;
  category: string;
  includeDeleted: boolean;
  page: number;
}): Promise<AdminProductListResult> {
  const search = new URLSearchParams({ page: String(params.page), limit: String(PAGE_SIZE) });
  if (params.q) search.set('q', params.q);
  if (params.category) search.set('category', params.category);
  if (params.includeDeleted) search.set('includeDeleted', 'true');

  const res = await fetch(`/api/admin/products?${search}`);
  const json = (await res.json().catch(() => null)) as {
    success: boolean;
    data?: AdminProductListResult;
    error?: { message?: string };
  } | null;
  if (!res.ok || !json?.success || !json.data) {
    throw new Error(json?.error?.message ?? 'Failed to load products');
  }
  return json.data;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function ProductsDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['admin-products', { q, category, includeDeleted, page }],
    queryFn: () => fetchProducts({ q, category, includeDeleted, page }),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, isDeleted }: { id: string; isDeleted: boolean }) => {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDeleted }),
      });
      const json = (await res.json().catch(() => null)) as {
        success: boolean;
        error?: { message?: string };
      } | null;
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message ?? 'Action failed');
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const data = query.data;

  function applyFilters(next: Partial<{ q: string; category: string; includeDeleted: boolean }>) {
    if (next.q !== undefined) setQ(next.q);
    if (next.category !== undefined) setCategory(next.category);
    if (next.includeDeleted !== undefined) setIncludeDeleted(next.includeDeleted);
    setPage(1);
  }

  function confirmDelete(name: string): boolean {
    return window.confirm(
      `Move "${name}" to deleted? It disappears from the store but keeps its data.`,
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">
            {data
              ? `${data.activeCount} active${data.deletedCount > 0 ? ` · ${data.deletedCount} deleted` : ''}`
              : 'Loading…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw
              className={query.isFetching ? 'animate-spin' : undefined}
              aria-hidden="true"
            />
            Refresh
          </Button>
          <Button size="sm" onClick={() => router.push('/admin/products/new')}>
            <Plus aria-hidden="true" /> New product
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={q}
          onChange={(event) => applyFilters({ q: event.target.value })}
          placeholder="Search name or brand…"
          className="h-9 max-w-xs"
          aria-label="Search products"
        />
        <select
          value={category}
          onChange={(event) => applyFilters({ category: event.target.value })}
          aria-label="Filter by category"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">All categories</option>
          {PRODUCT_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(event) => applyFilters({ includeDeleted: event.target.checked })}
            className="h-4 w-4 rounded border-input accent-primary"
          />
          Show deleted
        </label>
      </div>

      {query.isLoading && (
        <div className="space-y-2" aria-busy="true" aria-label="Loading products">
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
          <Boxes className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">No products found</p>
          <p className="text-sm text-muted-foreground">
            {q || category
              ? 'Try different search filters.'
              : 'Create your first product to get started.'}
          </p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="hidden grid-cols-[3rem_2fr_1fr_0.7fr_0.7fr_1fr_5rem] gap-4 border-b bg-muted/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid">
            <span className="sr-only">Image</span>
            <span>Product</span>
            <span>Category</span>
            <span className="text-right">Price</span>
            <span className="text-right">Stock</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>
          <ul className="divide-y">
            {data.items.map((product) => (
              <li
                key={product.id}
                className="grid grid-cols-1 items-center gap-3 px-4 py-3 md:grid-cols-[3rem_2fr_1fr_0.7fr_0.7fr_1fr_5rem] md:gap-4"
              >
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border bg-muted/40">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin thumbnails accept any URL, incl. /public paths
                    <img
                      src={product.image}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="block truncate font-medium hover:underline"
                  >
                    {product.name}
                  </Link>
                  <span className="block truncate text-xs text-muted-foreground">
                    {product.brand} · /{product.slug} · updated {formatDate(product.updatedAt)}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">{product.category}</span>
                <span className="text-sm font-semibold tabular-nums md:text-right">
                  {product.minPrice != null ? formatPrice(product.minPrice) : '—'}
                </span>
                <span className="text-sm tabular-nums md:text-right">{product.totalStock}</span>
                <span className="flex flex-wrap gap-1">
                  {product.isDeleted ? (
                    <span className="inline-flex whitespace-nowrap rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 ring-1 ring-inset ring-red-200">
                      Deleted
                    </span>
                  ) : (
                    <>
                      <span
                        className={
                          product.inStock && product.totalStock > 0
                            ? 'inline-flex whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200'
                            : 'inline-flex whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200'
                        }
                      >
                        {product.inStock && product.totalStock > 0 ? 'In stock' : 'Out of stock'}
                      </span>
                      {product.featured && (
                        <span className="inline-flex whitespace-nowrap rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800 ring-1 ring-inset ring-violet-200">
                          Featured
                        </span>
                      )}
                    </>
                  )}
                </span>
                <div className="flex items-center justify-start gap-1 md:justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${product.name}`}
                    onClick={() => router.push(`/admin/products/${product.id}`)}
                  >
                    <Pencil aria-hidden="true" />
                  </Button>
                  {product.isDeleted ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Restore ${product.name}`}
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate({ id: product.id, isDeleted: false })}
                    >
                      <Undo2 aria-hidden="true" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${product.name}`}
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (confirmDelete(product.name)) {
                          deleteMutation.mutate({ id: product.id, isDeleted: true });
                        }
                      }}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  )}
                </div>
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
