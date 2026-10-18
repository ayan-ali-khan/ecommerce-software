import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getCategoryCounts, getFeaturedProducts } from '@/lib/queries/products';
import { getPublicSettings } from '@/lib/queries/settings';
import { CategoryCard } from '@/components/store/category-card';
import { Hero } from '@/components/store/hero';
import { ProductCard } from '@/components/store/product-card';
import { TrustSection } from '@/components/store/trust-section';
import { Button } from '@/components/ui/button';

export default async function HomePage() {
  const [featured, categories, settings] = await Promise.all([
    getFeaturedProducts(8),
    getCategoryCounts(),
    getPublicSettings(),
  ]);

  return (
    <>
      <Hero settings={settings} />

      <section aria-labelledby="categories-heading" className="container py-12 sm:py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="categories-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
              Shop by category
            </h2>
            <p className="mt-1 text-muted-foreground">
              Everything you need for training, recovery and health.
            </p>
          </div>
          <Button asChild variant="ghost" className="hidden shrink-0 sm:inline-flex">
            <Link href="/products">
              View all
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(({ category, count }) => (
            <CategoryCard key={category} category={category} count={count} />
          ))}
        </div>
      </section>

      <section aria-labelledby="featured-heading" className="border-t bg-muted/40">
        <div className="container py-12 sm:py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="featured-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
                Featured products
              </h2>
              <p className="mt-1 text-muted-foreground">
                Hand-picked by the owner — the products athletes reorder the most.
              </p>
            </div>
            <Button asChild variant="ghost" className="hidden shrink-0 sm:inline-flex">
              <Link href="/products">
                All products
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>

          {featured.length === 0 ? (
            <p className="mt-6 text-muted-foreground">
              Products are on the way — check back soon, or{' '}
              <Link className="underline" href="/products">
                browse the shop
              </Link>
              .
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featured.map((product, index) => (
                <ProductCard
                  key={product.slug}
                  product={product}
                  settings={settings}
                  priority={index < 4}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <TrustSection />
    </>
  );
}
