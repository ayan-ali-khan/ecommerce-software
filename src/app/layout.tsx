import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { STORE } from '@/lib/store';
import { cn } from '@/lib/utils';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(STORE.siteUrl),
  title: {
    default: `${STORE.name} — Whey Protein, Creatine & Supplements in Meerut`,
    template: `%s | ${STORE.name}`,
  },
  description:
    'Shop genuine whey protein, creatine, pre-workout and vitamins. Order on the website or WhatsApp — the owner confirms payment and delivery personally. Meerut, India.',
  applicationName: STORE.name,
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(inter.variable)} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
