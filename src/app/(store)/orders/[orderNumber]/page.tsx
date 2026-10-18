import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, MessageCircle, Phone } from 'lucide-react';
import { telLink, waLink } from '@/lib/store';
import { getOrderByNumber } from '@/lib/queries/orders';
import { getPublicSettings } from '@/lib/queries/settings';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Order Received',
  description: 'Your order has been received — we will contact you shortly to confirm.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface OrderPageProps {
  params: Promise<{ orderNumber: string }>;
}

const ORDER_NUMBER_PATTERN = /^BB-[A-Z0-9]{6,12}$/;

export default async function OrderConfirmationPage({ params }: OrderPageProps) {
  const raw = (await params).orderNumber.trim().toUpperCase();
  if (!ORDER_NUMBER_PATTERN.test(raw)) notFound();

  const order = await getOrderByNumber(raw);
  if (!order) notFound();

  const settings = await getPublicSettings();

  const followUpMessage = [
    `Hi ${settings.storeName}! I just placed order ${order.orderNumber} on your website.`,
    `Total: ${formatPrice(order.total)}`,
    'Looking forward to your confirmation — thanks!',
  ].join('\n');

  return (
    <div className="container flex max-w-2xl justify-center py-10">
      <div className="w-full rounded-lg border bg-card p-6 sm:p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-bold">Order received!</h1>
          <p className="text-muted-foreground">
            The owner will contact you shortly to confirm payment and delivery.
          </p>
          <p className="rounded-full border bg-muted px-3 py-1 text-sm font-semibold tabular-nums">
            {order.orderNumber}
          </p>
        </div>

        <div className="mt-6 rounded-md border bg-muted/40 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Order summary
          </h2>
          <ul className="space-y-2 text-sm">
            {order.items.map((item, index) => (
              <li
                key={`${item.name}-${item.variant}-${index}`}
                className="flex justify-between gap-3"
              >
                <span className="min-w-0">
                  <span className="line-clamp-1">{item.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.variant} × {item.qty}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatPrice(item.price * item.qty)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t pt-3 text-sm">
            <span className="font-semibold">Total</span>
            <span className="font-semibold tabular-nums">{formatPrice(order.total)}</span>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
          Keep this order number handy for any follow-up about your order:{' '}
          <strong className="tabular-nums">{order.orderNumber}</strong>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Button asChild size="lg" className="bg-[#25D366] text-white hover:bg-[#1fb855]">
            <a
              href={waLink(followUpMessage, settings.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow up your order on WhatsApp"
            >
              <MessageCircle aria-hidden="true" />
              Follow up on WhatsApp
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={telLink(settings.phone)} aria-label="Call the store">
              <Phone aria-hidden="true" />
              Call the store
            </a>
          </Button>
        </div>

        <div className="mt-4 text-center">
          <Button asChild variant="ghost" className="text-muted-foreground">
            <Link href="/products">Continue shopping →</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
