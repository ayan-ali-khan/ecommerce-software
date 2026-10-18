import type { Metadata } from 'next';
import Link from 'next/link';
import { BadgeCheck, HeartPulse, Users } from 'lucide-react';
import { STORE, waLink } from '@/lib/store';
import { getPublicSettings } from '@/lib/queries/settings';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'About Us',
  description: `Learn about ${STORE.name} — a local Meerut supplement store selling genuine protein, creatine and vitamins with personal service.`,
  alternates: { canonical: '/about' },
};

const VALUES = [
  {
    icon: BadgeCheck,
    title: 'Genuine only',
    body: 'We stock only authorised-distributor stock with intact seals and valid expiry. If it’s not something we’d take ourselves, we don’t sell it.',
  },
  {
    icon: HeartPulse,
    title: 'Honest advice',
    body: 'No pushy upsells. Tell us your goal and budget and we’ll recommend what actually helps — including “you don’t need that yet”.',
  },
  {
    icon: Users,
    title: 'Personal service',
    body: 'You talk to the owner, not a call centre. Every order is confirmed by phone before it’s dispatched.',
  },
] as const;

export default async function AboutPage() {
  const settings = await getPublicSettings();
  const name = settings.storeName;

  return (
    <div className="container max-w-3xl py-10 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">About {name}</h1>

      <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
        <p>
          {name} is a local supplement store in Meerut run by someone who trains. We started because
          buying supplements in India is a minefield of imports, fakes and expired stock — and
          because most stores disappear after they take your money.
        </p>
        <p>
          We keep it simple: genuine products, clear prices, and a phone call to confirm every
          order. Whether you’re buying your first tub of whey or your hundredth, you get the same
          honest answer about what’s worth your money.
        </p>
        <p>
          Order on this website or message us on WhatsApp — we’ll confirm payment and delivery with
          you personally, then dispatch fast.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {VALUES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-lg border p-5">
            <Icon className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            <h2 className="mt-3 font-semibold">{title}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-3 rounded-lg bg-muted/60 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Ready to get started?</h2>
          <p className="text-sm text-muted-foreground">Browse the shop or chat with us directly.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/products">Shop now</Link>
          </Button>
          <Button asChild variant="outline">
            <a
              href={waLink(
                `Hi ${name}! I found you online — I have a question.`,
                settings.whatsapp,
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp us
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
