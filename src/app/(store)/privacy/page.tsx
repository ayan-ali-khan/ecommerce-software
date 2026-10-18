import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How we collect and use order details, and our privacy-friendly anonymous site tracking.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-10 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: October 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">What we collect</h2>
          <p>
            When you place an order we collect your name, phone number, delivery address, city,
            pincode, the products you ordered, and any notes you add. Your email is optional. We use
            these details only to contact you, confirm your order and deliver it.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Payment data</h2>
          <p>
            None. This website never sees or stores card, UPI or bank details — payments happen
            offline, directly between you and us.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Anonymous site analytics</h2>
          <p>
            We count visits using a simple, privacy-friendly system: an anonymous session ID (a
            random string with no personal information), the page you viewed, and the time of your
            visit. No IP address, no raw browser fingerprint and no third-party advertising trackers
            are used. Sessions expire automatically after 24 hours.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Cookies</h2>
          <p>
            This website does not use advertising cookies. Any cookies it sets are strictly
            necessary for the site to function (for example, remembering your shopping cart).
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Sharing</h2>
          <p>
            We do not sell or share your personal data. Details are shared only with delivery
            partners who need them to deliver your order, or where required by law.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">Your rights</h2>
          <p>
            You can ask us to correct or delete your order details at any time by contacting us
            through the Contact page. We will comply unless we are legally required to retain the
            records.
          </p>
        </section>
      </div>
    </div>
  );
}
