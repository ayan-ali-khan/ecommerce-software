import { SettingsProvider } from '@/lib/settings-context';
import { getPublicSettings } from '@/lib/queries/settings';
import { SiteFooter } from '@/components/store/site-footer';
import { SiteHeader } from '@/components/store/site-header';
import { FloatingWhatsApp } from '@/components/store/floating-whatsapp';

/**
 * Public storefront chrome. Admin routes live outside this group (no store header there).
 *
 * `force-dynamic`: owner settings (store name, phone, WhatsApp, address) must reflect
 * Admin → Settings edits without a rebuild, so the chrome is rendered per request from
 * the settings doc. Every page under this layout (header, footer, floating WhatsApp)
 * therefore renders live — nothing here is baked at build time. Settings reads already
 * tolerate a missing/unreachable DB by falling back to the env defaults.
 */
export const dynamic = 'force-dynamic';

/** Public storefront chrome + owner settings provider. */
export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicSettings();

  return (
    <SettingsProvider settings={settings}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter settings={settings} />
        <FloatingWhatsApp settings={settings} />
      </div>
    </SettingsProvider>
  );
}
