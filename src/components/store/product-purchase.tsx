'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Minus, Phone, Plus } from 'lucide-react';
import { telLink, waLink } from '@/lib/store';
import { useSettings } from '@/lib/settings-context';
import { cn, formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PriceTag } from './price-tag';

interface PurchaseVariant {
  label: string;
  price: number;
  mrp?: number | null;
}

interface PurchaseProduct {
  slug: string;
  name: string;
  inStock: boolean;
  variants: PurchaseVariant[];
}

interface ProductPurchaseProps {
  product: PurchaseProduct;
  /** Absolute URL of this product page (included in the WhatsApp message). */
  pageUrl: string;
}

const MAX_QTY = 50;

export function ProductPurchase({ product, pageUrl }: ProductPurchaseProps) {
  const [variantIndex, setVariantIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const settings = useSettings();
  const storeName = settings.storeName;

  const variant = product.variants[variantIndex] ?? product.variants[0];
  const price = variant?.price ?? 0;
  const inStock = product.inStock;

  const whatsappMessage = inStock
    ? [
        `Hi ${storeName}! I want to order:`,
        `• Product: ${product.name}`,
        `• Variant: ${variant?.label ?? 'Standard'}`,
        `• Qty: ${qty}`,
        `• Price: ${formatPrice(price * qty)}`,
        `• Link: ${pageUrl}`,
      ].join('\n')
    : [
        `Hi ${storeName}! Is "${product.name}" (${variant?.label ?? 'Standard'}) going to be`,
        'back in stock? Please let me know.',
        pageUrl,
      ].join('\n');

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Variant</legend>
        <div className="grid gap-2">
          {product.variants.map((v, index) => (
            <label
              key={v.label}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-3 rounded-md border p-3 text-sm transition-colors',
                'hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-accent has-[:checked]:ring-1 has-[:checked]:ring-primary',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
              )}
            >
              <input
                type="radio"
                name="variant"
                className="sr-only"
                value={v.label}
                checked={index === variantIndex}
                onChange={() => setVariantIndex(index)}
              />
              <span className="font-medium">{v.label}</span>
              <span className="tabular-nums text-muted-foreground">{formatPrice(v.price)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center justify-between gap-4">
        <PriceTag price={price} mrp={variant?.mrp} size="lg" />
        <div className="flex items-center gap-1 rounded-md border" aria-label="Quantity">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Decrease quantity"
            className="flex h-9 w-9 items-center justify-center rounded-l-md transition-colors hover:bg-accent disabled:opacity-40"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="w-10 text-center text-sm font-medium tabular-nums" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
            disabled={qty >= MAX_QTY}
            aria-label="Increase quantity"
            className="flex h-9 w-9 items-center justify-center rounded-r-md transition-colors hover:bg-accent disabled:opacity-40"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <p className="flex items-center gap-2 text-sm">
        <span
          aria-hidden="true"
          className={cn('h-2.5 w-2.5 rounded-full', inStock ? 'bg-emerald-500' : 'bg-destructive')}
        />
        {inStock
          ? 'In stock — usually dispatched within 24 hours'
          : 'Out of stock — call or WhatsApp to ask about the next restock'}
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button asChild size="lg" className="bg-[#25D366] text-white hover:bg-[#1fb855]">
          <a
            href={waLink(whatsappMessage, settings.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={
              inStock ? 'Order this product on WhatsApp' : 'Ask about this product on WhatsApp'
            }
          >
            <MessageCircle aria-hidden="true" />
            {inStock ? 'Order on WhatsApp' : 'Ask on WhatsApp'}
          </a>
        </Button>
        <Button asChild size="lg" variant="outline">
          <a href={telLink(settings.phone)} aria-label="Call the store now">
            <Phone aria-hidden="true" />
            Call Now
          </a>
        </Button>
      </div>

      {inStock ? (
        <Button asChild size="lg" className="w-full">
          <Link
            href={`/cart?slug=${product.slug}&variant=${encodeURIComponent(variant?.label ?? '')}&qty=${qty}`}
          >
            Place Order
          </Link>
        </Button>
      ) : (
        <Button size="lg" className="w-full" disabled>
          Out of Stock
        </Button>
      )}

      {!inStock && (
        <p className="text-sm text-muted-foreground">
          This product is currently unavailable. Tap “Ask on WhatsApp” and we’ll message you when
          it’s back.
        </p>
      )}
    </div>
  );
}
