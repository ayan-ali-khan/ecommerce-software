import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Current filters to preserve while paging. */
  filters: { q?: string; category?: string; sort?: string };
}

function pageHref(pageNumber: number, filters: PaginationProps['filters']): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.category) params.set('category', filters.category);
  if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);
  if (pageNumber > 1) params.set('page', String(pageNumber));
  const qs = params.toString();
  return qs ? `/products?${qs}` : '/products';
}

function buildPages(page: number, totalPages: number): (number | '…')[] {
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const result: (number | '…')[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push('…');
    result.push(p);
    prev = p;
  }
  return result;
}

export function Pagination({ page, totalPages, filters }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1.5">
      <Link
        href={pageHref(Math.max(1, page - 1), filters)}
        aria-disabled={page <= 1}
        tabIndex={page <= 1 ? -1 : undefined}
        className={cn(
          'inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm font-medium transition-colors hover:bg-accent',
          page <= 1 && 'pointer-events-none opacity-40',
        )}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Prev
      </Link>

      {buildPages(page, totalPages).map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-2 text-sm text-muted-foreground" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={pageHref(p, filters)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              'inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors hover:bg-accent',
              p === page && 'border-primary bg-primary text-primary-foreground hover:bg-primary/90',
            )}
          >
            {p}
          </Link>
        ),
      )}

      <Link
        href={pageHref(Math.min(totalPages, page + 1), filters)}
        aria-disabled={page >= totalPages}
        tabIndex={page >= totalPages ? -1 : undefined}
        className={cn(
          'inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm font-medium transition-colors hover:bg-accent',
          page >= totalPages && 'pointer-events-none opacity-40',
        )}
      >
        Next
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </nav>
  );
}
