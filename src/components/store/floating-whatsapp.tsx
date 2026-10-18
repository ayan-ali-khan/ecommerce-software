import { MessageCircle } from 'lucide-react';
import { waLink, type PublicSettings } from '@/lib/store';

/** Fixed WhatsApp action button — appears on every storefront page. */
export function FloatingWhatsApp({ settings }: { settings: PublicSettings }) {
  return (
    <a
      href={waLink(
        `Hi ${settings.storeName}! I have a question about your supplements.`,
        settings.whatsapp,
      )}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <MessageCircle className="h-7 w-7" aria-hidden="true" />
    </a>
  );
}
