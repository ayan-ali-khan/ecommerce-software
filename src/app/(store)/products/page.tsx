import type { Metadata } from 'next';
import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { getCategoryCounts, listProducts } from '@/lib/queries/products';
import { getPublicSettings } from '@/lib/queries/settings';
import { productListQuerySchema } from '@/lib/validators';
import { ProductCard } from '@/components/store/product-card';
import { ProductFilters } from '@/components/store/product-filters';
import { Pagination } from '@/components/store/pagination';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Shop Supplements — Protein, Creatine, Pre-Workout & Vitamins',
  description:
    'Browse whey protein, creatine, pre-workout, vitamins and more. Search, filter by category and sort by price. Out-of-stock items are clearly marked.',
  alternates: { canonical: '/products' },
};

interface SearchParams {
  q?: string | string[];
  category?: string | string[];
  sort?: string | string[];
  page?: string | string[];
}

function single(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const raw = {
    q: single(sp.q),
    category: single(sp.category),
    sort: single(sp.sort),
    page: single(sp.page),
  };

  // Ignore malformed sort/page values instead of failing the page.
  const parsed = productListQuerySchema.safeParse(raw);
  const query = parsed.success
    ? parsed.data
    : productListQuerySchema.parse({ q: raw.q, category: raw.category });

  const [result, categories, settings] = await Promise.all([
    listProducts(query),
    getCategoryCounts(),
    getPublicSettings(),
  ]);

  const filters = {
    q: query.q,
    category: query.category,
    sort: query.sort !== 'newest' ? query.sort : undefined,
  };

  return (
    <div className="container py-8 sm:py-12">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Shop supplements</h1>
        <p className="mt-1 text-muted-foreground">
          {query.category ? `${query.category} · ` : ''}Genuine products, honest prices, pay after
          confirmation.
        </p>
      </header>

      <ProductFilters categories={categories} total={result.total} />

      {result.items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
          <SearchX className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-lg font-semibold">No products found</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            We couldn’t find anything matching your search. Try a different keyword, or clear the
            filters to see everything.
          </p>
          <Button asChild variant="outline" className="mt-2">
            <Link href="/products">Clear filters</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {result.items.map((product, index) => (
              <ProductCard
                key={product.slug}
                product={product}
                settings={settings}
                priority={index < 4}
              />
            ))}
          </div>
          <Pagination page={result.page} totalPages={result.totalPages} filters={filters} />
        </>
      )}
    </div>
  );
}
