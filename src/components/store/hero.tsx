import Link from 'next/link';
import { ArrowRight, MessageCircle, ShieldCheck, Truck, Wallet } from 'lucide-react';
import { waLink, type PublicSettings } from '@/lib/store';
import { Button } from '@/components/ui/button';

const HIGHLIGHTS = [
  { icon: ShieldCheck, label: '100% genuine products' },
  { icon: Truck, label: 'Fast delivery' },
  { icon: Wallet, label: 'Pay after confirmation' },
] as const;

export function Hero({ settings }: { settings: PublicSettings }) {
  const { storeName } = settings;
  return (
    <section className="border-b bg-gradient-to-b from-muted/60 to-background">
      <div className="container flex flex-col items-start gap-6 py-14 sm:py-20">
        <p className="rounded-full border bg-background px-3 py-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Meerut’s supplement store
        </p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Fuel your training with <span className="text-emerald-600">genuine supplements</span>
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Whey protein, creatine, pre-workout and vitamins from trusted brands — at {storeName}.
          Order on the website or WhatsApp; we call you to confirm payment and delivery.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/products">
              Shop all products
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a
              href={waLink(`Hi ${storeName}! I want to order supplements.`, settings.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle aria-hidden="true" />
              Order on WhatsApp
            </a>
          </Button>
        </div>

        <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {HIGHLIGHTS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
