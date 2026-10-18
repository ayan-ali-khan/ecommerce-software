import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy',
  description:
    'How order cancellation, returns and refunds work — no online payment, everything confirmed personally.',
  alternates: { canonical: '/refund' },
};

export default function RefundPage() {
  return (
    <div className="container max-w-3xl py-10 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight">Refund &amp; Cancellation Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: October 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">No online payment</h2>
          <p>
            This website does not collect any payment. You pay only after we confirm your order by
            phone or WhatsApp — by cash, UPI or on delivery. If you cancel before dispatch, there is
            nothing to refund because nothing has been charged.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Cancelling an order</h2>
          <p>
            You can cancel any time before your order is dispatched — just call or WhatsApp us with
            your order details. If an order has already been dispatched, please refuse delivery or
            follow the return process below.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Returns</h2>
          <p>
            Because supplements are consumable products, we can only accept returns of items that
            are unopened, sealed and in original condition, within 7 days of delivery. Sealed
            returns are inspected on arrival before a refund is issued.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            Damaged, wrong or missing items
          </h2>
          <p>
            If your order arrives damaged, expired, or with the wrong product, contact us within 48
            hours of delivery with a photo. We will arrange a replacement or a full refund,
            including return shipping, at no cost to you.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">How refunds are issued</h2>
          <p>
            Refunds are processed to the original payment method (UPI/bank transfer) or as store
            credit if you prefer, typically within 3–5 business days of the return being approved.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Need help?</h2>
          <p>
            The fastest way is a call or WhatsApp — see the Contact page. We sort issues out
            personally.
          </p>
        </section>
      </div>
    </div>
  );
}
