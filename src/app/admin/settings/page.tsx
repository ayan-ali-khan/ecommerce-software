import type { Metadata } from 'next';
import { SettingsPage } from '@/components/admin/settings-page';

export const metadata: Metadata = {
  title: 'Store settings',
  description: 'Owner-editable store name, contact details and notification preferences.',
};

export default function AdminSettingsPage() {
  return <SettingsPage />;
}
