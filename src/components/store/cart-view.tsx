'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { waLink } from '@/lib/store';
import { useSettings } from '@/lib/settings-context';
import { addToCart, cartKeyOf, removeFromCart, setQty, useCart, type CartItem } from '@/lib/cart';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CartViewProps {
  /** Item requested via /cart?slug=…&variant=…&qty=… (from a product page “Place Order”). */
  pendingItem: CartItem | null;
}

export function CartView({ pendingItem }: CartViewProps) {
  const { items, count, total } = useCart();
  const { storeName } = useSettings();
  const [mounted, setMounted] = useState(false);
  const appliedRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // URL-driven add. Idempotent: re-visiting the URL never bumps quantities.
  useEffect(() => {
    if (!pendingItem) return;
    const signature = cartKeyOf(pendingItem);
    if (appliedRef.current === signature) return;
    appliedRef.current = signature;
    addToCart(pendingItem);
  }, [pendingItem]);

  const showSkeleton = !mounted && items.length === 0;

  if (showSkeleton) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading your cart">
        {[0, 1].map((row) => (
          <div key={row} className="flex gap-4 rounded-lg border p-4">
            <div className="h-20 w-20 shrink-0 animate-pulse rounded-md bg-muted" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[45vh] flex-col items-center justify-center gap-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <ShoppingCart className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="max-w-md text-muted-foreground">
          Browse our supplements and add what you need — you can also order directly on WhatsApp.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <Link href="/products">Start shopping</Link>
          </Button>
          <Button asChild variant="outline">
            <a
              href={waLink(`Hi ${storeName}! I would like to place an order.`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle aria-hidden="true" />
              Order on WhatsApp
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-bold">Your Cart</h1>
          <p className="text-sm text-muted-foreground">
            {count} item{count === 1 ? '' : 's'}
          </p>
        </div>

        <ul className="space-y-3">
          {items.map((item) => {
            const key = cartKeyOf(item);
            return (
              <li key={key} className="flex gap-4 rounded-lg border p-4">
                <Link
                  href={`/products/${item.slug}`}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted"
                  aria-hidden="true"
                  tabIndex={-1}
                >
                  <Image
                    src={item.image || '/products/placeholder.png'}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Link
                    href={`/products/${item.slug}`}
                    className="line-clamp-1 text-sm font-medium hover:underline"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                  <p className="text-sm tabular-nums text-muted-foreground">
                    {formatPrice(item.price)} each
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                    <div className="flex items-center rounded-md border" aria-label="Quantity">
                      <button
                        type="button"
                        onClick={() => setQty(key, item.qty - 1)}
                        disabled={item.qty <= 1}
                        aria-label={`Decrease quantity of ${item.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-l-md transition-colors hover:bg-accent disabled:opacity-40"
                      >
                        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <span className="w-9 text-center text-sm font-medium tabular-nums">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(key, item.qty + 1)}
                        disabled={item.qty >= 50}
                        aria-label={`Increase quantity of ${item.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-r-md transition-colors hover:bg-accent disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold tabular-nums">
                        {formatPrice(item.price * item.qty)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(key)}
                        aria-label={`Remove ${item.name} from cart`}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <Button asChild variant="ghost" className="px-0 text-muted-foreground">
          <Link href="/products">← Continue shopping</Link>
        </Button>
      </div>

      <aside className="h-fit rounded-lg border p-5 lg:sticky lg:top-24">
        <h2 className="mb-4 text-lg font-semibold">Order summary</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal ({count} items)</dt>
            <dd className="font-medium tabular-nums">{formatPrice(total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Delivery</dt>
            <dd className="font-medium">Confirmed on call</dd>
          </div>
          <div className="flex justify-between border-t pt-3 text-base">
            <dt className="font-semibold">Total</dt>
            <dd className="font-semibold tabular-nums">{formatPrice(total)}</dd>
          </div>
        </dl>

        <Button asChild size="lg" className="mt-5 w-full">
          <Link href="/checkout">Proceed to Checkout</Link>
        </Button>

        <p className="mt-3 text-xs text-muted-foreground">
          No online payment. The owner calls to confirm your order, payment and delivery — usually
          within a few hours.
        </p>
      </aside>
    </div>
  );
}
