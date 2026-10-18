import Link from 'next/link';
import { Clock, Dumbbell, MapPin, MessageCircle, Phone } from 'lucide-react';
import { telLink, waLink, type PublicSettings } from '@/lib/store';
import { PRODUCT_CATEGORIES } from '@/lib/validators';

const QUICK_LINKS = [
  { href: '/products', label: 'All products' },
  { href: '/about', label: 'About us' },
  { href: '/contact', label: 'Contact' },
  { href: '/cart', label: 'Your cart' },
] as const;

const LEGAL_LINKS = [
  { href: '/terms', label: 'Terms' },
  { href: '/refund', label: 'Refund policy' },
  { href: '/privacy', label: 'Privacy policy' },
] as const;

export function SiteFooter({ settings }: { settings: PublicSettings }) {
  const { storeName: name, phone, address } = settings;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/40">
      <div className="container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Dumbbell className="h-5 w-5" aria-hidden="true" />
            </span>
            {name}
          </div>
          <p className="text-sm text-muted-foreground">
            Genuine gym supplements — protein, creatine, pre-workout and vitamins. Order online or
            on WhatsApp; payment is confirmed personally after your order.
          </p>
        </div>

        <nav aria-label="Shop">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">Shop</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {PRODUCT_CATEGORIES.slice(0, 6).map((category) => (
              <li key={category}>
                <Link
                  href={`/products?category=${encodeURIComponent(category)}`}
                  className="hover:text-foreground"
                >
                  {category}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/products" className="hover:text-foreground">
                View all
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Information">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">Information</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">Contact</h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{address}</span>
            </li>
            <li className="flex gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <a href={telLink(phone)} className="hover:text-foreground">
                {phone}
              </a>
            </li>
            <li className="flex gap-2">
              <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <a
                href={waLink(
                  `Hi ${name}! I have a question about your supplements.`,
                  settings.whatsapp,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                Chat on WhatsApp
              </a>
            </li>
            <li className="flex gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Mon–Sat, 10:00 AM – 8:00 PM</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="container flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {name}. All rights reserved.
          </p>
          <p>Pay after order confirmation — no online payment required.</p>
        </div>
      </div>
    </footer>
  );
}
