import type { Metadata } from 'next';
import { CheckoutClient } from '@/components/store/checkout-client';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Enter your delivery details — we confirm every order personally by phone.',
  alternates: { canonical: '/checkout' },
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="container max-w-5xl py-8">
      <CheckoutClient />
    </div>
  );
}
