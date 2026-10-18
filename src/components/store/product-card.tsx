import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import type { ProductListItem } from '@/lib/queries/products';
import { absoluteUrl, waLink, DEFAULT_SETTINGS, type PublicSettings } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { PriceTag } from './price-tag';

interface ProductCardProps {
  product: ProductListItem;
  /** Owner settings; the caller fetches once and shares across the whole grid. */
  settings?: PublicSettings;
  /** e.g. "(max-width: 640px) 50vw, 25vw" */
  imageSizes?: string;
  /** Preload for above-the-fold cards (improves LCP). */
  priority?: boolean;
}

export function ProductCard({
  product,
  settings = DEFAULT_SETTINGS,
  imageSizes = '(max-width: 640px) 50vw, 25vw',
  priority = false,
}: ProductCardProps) {
  const href = `/products/${product.slug}`;
  const firstVariant = product.variants[0];
  const quickOrderMessage = [
    `Hi ${settings.storeName}! I want to order:`,
    `• Product: ${product.name}`,
    `• Variant: ${firstVariant?.label ?? 'Standard'}`,
    `• Qty: 1`,
    `• Link: ${absoluteUrl(href)}`,
  ].join('\n');

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md">
      <Link
        href={href}
        className="relative aspect-square overflow-hidden bg-muted"
        tabIndex={-1}
        aria-hidden="true"
      >
        <Image
          src={product.images[0] ?? '/products/placeholder.png'}
          alt=""
          fill
          priority={priority}
          sizes={imageSizes}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {!product.inStock && (
          <span className="absolute left-3 top-3 rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground shadow">
            Out of Stock
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {product.category} · {product.brand}
        </p>
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">
          <Link href={href} className="hover:underline">
            {product.name}
            <span className="sr-only">, {product.inStock ? 'in stock' : 'out of stock'}</span>
          </Link>
        </h3>
        <PriceTag price={product.minPrice} mrp={product.maxMrp} />

        <div className="mt-auto flex gap-2 pt-3">
          <Button asChild size="sm" className="flex-1">
            <Link href={href}>View details</Link>
          </Button>
          {product.inStock && (
            <Button
              asChild
              size="sm"
              variant="outline"
              aria-label={`Order ${product.name} on WhatsApp`}
            >
              <a
                href={waLink(quickOrderMessage, settings.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle aria-hidden="true" />
                Order
              </a>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
