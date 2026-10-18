import { BadgeCheck, MessageCircle, Truck, Wallet } from 'lucide-react';

const ITEMS = [
  {
    icon: BadgeCheck,
    title: '100% genuine products',
    body: 'Sourced directly from authorised distributors. Check the batch, seal and expiry on every pack.',
  },
  {
    icon: Wallet,
    title: 'No online payment',
    body: 'Place your order and we call you to confirm payment and delivery. Pay cash, UPI or on delivery.',
  },
  {
    icon: Truck,
    title: 'Fast delivery',
    body: 'Same-day dispatch for local Meerut orders and quick delivery across India.',
  },
  {
    icon: MessageCircle,
    title: 'Personal WhatsApp support',
    body: 'Questions about dosage, flavours or stacks? Talk directly to the owner, not a bot.',
  },
] as const;

export function TrustSection() {
  return (
    <section aria-labelledby="trust-heading" className="border-t bg-muted/40">
      <div className="container py-14">
        <h2 id="trust-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
          Why athletes trust us
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-lg border bg-background p-5">
              <Icon className="h-6 w-6 text-emerald-600" aria-hidden="true" />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
