import type { Metadata } from 'next';
import { Providers } from '@/components/admin/providers';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin' },
  robots: { index: false, follow: false },
};

/** Admin shell: Query provider only — chrome lives in the (dashboard) group. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
