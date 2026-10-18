import type { Metadata } from 'next';
import { Clock, MapPin, MessageCircle, Phone } from 'lucide-react';
import { STORE, telLink, waLink } from '@/lib/store';
import { getPublicSettings } from '@/lib/queries/settings';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: `Contact ${STORE.name} — call, WhatsApp or visit our store in Meerut. We confirm every order personally.`,
  alternates: { canonical: '/contact' },
};

const MAPS_LINK = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
const MAPS_EMBED = (address: string) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&output=embed`;

export default async function ContactPage() {
  const { storeName, phone, address, whatsapp } = await getPublicSettings();
  const mapsLink = MAPS_LINK(address);
  const mapsEmbed = MAPS_EMBED(address);

  return (
    <div className="container py-10 sm:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Contact us</h1>
        <p className="mt-3 text-muted-foreground">
          Questions about a product, your order or delivery? Reach us any way you like — a real
          person answers.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-lg border p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <MapPin className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              Store address
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{address}</p>
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-medium underline"
            >
              Open in Google Maps
            </a>
          </div>

          <div className="rounded-lg border p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <Phone className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              Phone & WhatsApp
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{phone}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <a href={telLink(phone)}>
                  <Phone aria-hidden="true" />
                  Call now
                </a>
              </Button>
              <Button asChild size="sm" variant="outline">
                <a
                  href={waLink(
                    `Hi ${storeName}! I have a question about your supplements.`,
                    whatsapp,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle aria-hidden="true" />
                  WhatsApp us
                </a>
              </Button>
            </div>
          </div>

          <div className="rounded-lg border p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <Clock className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              Store hours
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Monday – Saturday: 10:00 AM – 8:00 PM
              <br />
              Sunday: closed (WhatsApp still answered)
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <iframe
            title={`Map showing ${storeName} at ${address}`}
            src={mapsEmbed}
            className="h-full min-h-[320px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
