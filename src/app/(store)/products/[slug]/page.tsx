import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { getProductBySlug } from '@/lib/queries/products';
import { getPublicSettings } from '@/lib/queries/settings';
import { absoluteUrl, telLink } from '@/lib/store';
import { ProductGallery } from '@/components/store/product-gallery';
import { ProductPurchase } from '@/components/store/product-purchase';
import { PriceTag } from '@/components/store/price-tag';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(decodeURIComponent(slug));
  // notFound() here (not just in the page) so Next.js returns a real HTTP 404
  // for missing AND soft-deleted products instead of a 200 soft-404.
  if (!product) notFound();

  const description = product.description.slice(0, 155);
  const image = product.images[0];

  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      type: 'website',
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(decodeURIComponent(slug));
  if (!product) notFound();

  const pageUrl = absoluteUrl(`/products/${product.slug}`);
  const settings = await getPublicSettings();
  const firstVariant = product.variants[0];
  const price = product.minPrice;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    brand: { '@type': 'Brand', name: product.brand },
    sku: firstVariant?.sku ?? undefined,
    category: product.category,
    ...(product.images.length > 0
      ? { image: product.images.map((src) => (src.startsWith('/') ? absoluteUrl(src) : src)) }
      : {}),
    offers: {
      '@type': 'Offer',
      url: pageUrl,
      priceCurrency: 'INR',
      price: String(price),
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  return (
    <div className="container py-6 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/products" className="hover:text-foreground hover:underline">
              Shop
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li>
            <Link
              href={`/products?category=${encodeURIComponent(product.category)}`}
              className="hover:text-foreground hover:underline"
            >
              {product.category}
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li aria-current="page" className="truncate text-foreground">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} name={product.name} inStock={product.inStock} />

        <div className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {product.category} · {product.brand}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{product.name}</h1>
          </div>

          <ProductPurchase
            product={{
              slug: product.slug,
              name: product.name,
              inStock: product.inStock,
              variants: product.variants.map((v) => ({
                label: v.label,
                price: v.price,
                mrp: v.mrp ?? null,
              })),
            }}
            pageUrl={pageUrl}
          />

          <div className="rounded-lg border p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">How ordering works</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Place your order on the website or WhatsApp.</li>
              <li>We call you to confirm payment and delivery.</li>
              <li>Pay cash, UPI or on delivery — no online payment needed.</li>
            </ol>
            <p className="mt-3">
              Prefer to talk?{' '}
              <a href={telLink(settings.phone)} className="font-medium text-foreground underline">
                Call us
              </a>{' '}
              — we’re happy to help you pick the right supplement.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="description-heading" className="rounded-lg border p-5 sm:p-6">
          <h2 id="description-heading" className="text-lg font-semibold">
            Description
          </h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
          {product.ingredients && (
            <>
              <h3 className="mt-5 text-sm font-semibold">Ingredients</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{product.ingredients}</p>
            </>
          )}
        </section>

        <section aria-labelledby="nutrition-heading" className="rounded-lg border p-5 sm:p-6">
          <h2 id="nutrition-heading" className="text-lg font-semibold">
            Nutrition facts
          </h2>
          {product.nutritionFacts.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Nutrition information is listed on the product label — WhatsApp us for details.
            </p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <caption className="sr-only">Nutrition facts for {product.name}</caption>
              <tbody>
                {product.nutritionFacts.map((fact) => (
                  <tr key={fact.label} className="border-b last:border-0">
                    <th scope="row" className="py-2.5 text-left font-normal text-muted-foreground">
                      {fact.label}
                    </th>
                    <td className="py-2.5 text-right font-medium tabular-nums">{fact.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="mt-4 flex items-center justify-between gap-3 rounded-md bg-muted/60 p-3">
            <span className="text-sm text-muted-foreground">Starting from</span>
            <PriceTag price={price} mrp={product.maxMrp} />
          </div>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
    </div>
  );
}
