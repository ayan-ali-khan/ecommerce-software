'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ShoppingCart } from 'lucide-react';
import { clearCart, useCart } from '@/lib/cart';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CheckoutForm } from './checkout-form';

/** Checkout page shell: reads the cart, renders the summary + form, handles redirects. */
export function CheckoutClient() {
  const { items, count, total } = useCart();
  const [mounted, setMounted] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (placedOrder) {
    return (
      <div
        className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center"
        aria-live="polite"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <h1 className="text-xl font-semibold">Order placed!</h1>
        <p className="text-muted-foreground">Opening your confirmation…</p>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading checkout">
        <div className="h-7 w-40 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg border bg-muted/40" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[45vh] flex-col items-center justify-center gap-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <ShoppingCart className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-bold">Nothing to check out</h1>
        <p className="max-w-md text-muted-foreground">Your cart is empty — add a product first.</p>
        <Button asChild>
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  const handlePlaced = (orderNumber: string) => {
    clearCart();
    setPlacedOrder(orderNumber);
    router.push(`/orders/${orderNumber}`);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us where to deliver — the owner calls you personally to confirm.
        </p>
        <CheckoutForm items={items} onPlaced={handlePlaced} />
      </div>

      <aside className="h-fit rounded-lg border p-5 lg:sticky lg:top-24">
        <h2 className="mb-4 text-lg font-semibold">Your order</h2>
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li
              key={`${item.productId}::${item.variantLabel}`}
              className="flex justify-between gap-3"
            >
              <span className="min-w-0">
                <span className="line-clamp-1">{item.name}</span>
                <span className="text-xs text-muted-foreground">
                  {item.variantLabel} × {item.qty}
                </span>
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {formatPrice(item.price * item.qty)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Items</dt>
            <dd className="tabular-nums">{count}</dd>
          </div>
          <div className="flex justify-between text-base">
            <dt className="font-semibold">Total</dt>
            <dd className="font-semibold tabular-nums">{formatPrice(total)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          Prices are re-checked on the server when you place the order.
        </p>
      </aside>
    </div>
  );
}
