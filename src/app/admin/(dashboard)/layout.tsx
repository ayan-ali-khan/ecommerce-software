import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/guard';
import { getPublicSettings } from '@/lib/queries/settings';
import { SettingsProvider } from '@/lib/settings-context';
import { AdminNav } from '@/components/admin/admin-nav';

/**
 * Dashboard chrome. middleware.ts already gates /admin; this is belt-and-braces.
 *
 * Sessions make these pages per-user, so they must never be statically prerendered
 * or shared from cache (`force-dynamic` also sets private/no-store caching).
 */
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/admin/login');

  const settings = await getPublicSettings();

  return (
    <SettingsProvider settings={settings}>
      <div className="flex min-h-screen flex-col bg-muted/30">
        <AdminNav email={session.email} />
        <main className="container flex-1 py-6">{children}</main>
      </div>
    </SettingsProvider>
  );
}
