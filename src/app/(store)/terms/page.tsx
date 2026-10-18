import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of service for using this website and placing orders.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-10 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: October 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">1. About these terms</h2>
          <p>
            These terms apply when you use this website or place an order with us. By placing an
            order you confirm that the information you provide is accurate and that you are
            purchasing for personal use.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">2. Orders and payment</h2>
          <p>
            No payment is collected on this website. Every order is provisional until we contact you
            by phone or WhatsApp to confirm stock, price, delivery and payment. We reserve the right
            to cancel or refuse an order (for example, if a product is out of stock or a pricing
            error occurred).
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">3. Product information</h2>
          <p>
            We make every effort to keep product descriptions, images, nutrition information and
            prices accurate. Batch packaging may differ from images. Supplements are not intended to
            diagnose, treat, cure or prevent any disease — consult a physician before starting any
            supplement, especially if you have a medical condition or take medication.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">4. Pricing errors</h2>
          <p>
            If a product is listed at an incorrect price due to a typographical or system error, we
            may cancel the order and refund any amount paid, even after an order confirmation.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">5. Liability</h2>
          <p>
            To the maximum extent permitted by law, our liability for any claim arising from an
            order is limited to the value of that order. Nothing in these terms limits liability
            that cannot be limited by law.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">6. Changes</h2>
          <p>
            We may update these terms from time to time. The version published on this website at
            the time of your order applies to that order.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">7. Contact</h2>
          <p>
            Questions about these terms? Call or WhatsApp us — see the Contact page for details.
          </p>
        </section>
      </div>
    </div>
  );
}
