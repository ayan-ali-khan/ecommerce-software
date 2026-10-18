'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { RotateCcw, Search } from 'lucide-react';
import { PRODUCT_SORTS, type ProductSort } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SORT_LABELS: Record<ProductSort, string> = {
  newest: 'Newest first',
  price_asc: 'Price: low to high',
  price_desc: 'Price: high to low',
};

interface ProductFiltersProps {
  categories: { category: string; count: number }[];
  total: number;
}

export function ProductFilters({ categories, total }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeQ = searchParams.get('q') ?? '';
  const activeCategory = searchParams.get('category');
  const activeSort = (searchParams.get('sort') ?? 'newest') as ProductSort;
  const hasFilters = Boolean(activeQ || activeCategory);

  const [input, setInput] = useState(activeQ);
  useEffect(() => setInput(activeQ), [activeQ]);

  function update(params: Record<string, string | null>): void {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    next.delete('page'); // filters reset pagination
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    update({ q: input.trim() || null });
  }

  return (
    <div className="space-y-4">
      <form role="search" onSubmit={onSubmit} className="flex gap-2">
        <label htmlFor="product-search" className="sr-only">
          Search products
        </label>
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="product-search"
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search protein, creatine, brand…"
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <Button type="submit" className="shrink-0">
          Search
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => update({ category: null })}
          aria-pressed={!activeCategory}
          className={cn(
            'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
            !activeCategory
              ? 'border-primary bg-primary text-primary-foreground'
              : 'bg-background text-muted-foreground hover:text-foreground',
          )}
        >
          All
        </button>
        {categories.map(({ category, count }) => (
          <button
            key={category}
            type="button"
            onClick={() => update({ category })}
            aria-pressed={activeCategory === category}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              activeCategory === category
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:text-foreground',
            )}
          >
            {category}
            <span className="ml-1.5 text-xs opacity-70">{count}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {total} product{total === 1 ? '' : 's'} found
          {activeQ && (
            <>
              {' '}
              for <span className="font-medium text-foreground">“{activeQ}”</span>
            </>
          )}
        </p>

        <div className="flex items-center gap-2">
          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setInput('');
                router.replace(pathname, { scroll: false });
              }}
            >
              <RotateCcw aria-hidden="true" />
              Clear
            </Button>
          )}
          <label htmlFor="product-sort" className="text-sm text-muted-foreground">
            Sort
          </label>
          <select
            id="product-sort"
            value={activeSort}
            onChange={(e) => update({ sort: e.target.value })}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {PRODUCT_SORTS.map((sort) => (
              <option key={sort} value={sort}>
                {SORT_LABELS[sort]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
