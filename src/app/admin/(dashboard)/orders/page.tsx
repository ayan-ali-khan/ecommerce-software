import type { Metadata } from 'next';
import { OrdersDashboard } from '@/components/admin/orders-dashboard';

export const metadata: Metadata = {
  title: 'Orders',
  robots: { index: false, follow: false },
};

export default function AdminOrdersPage() {
  return <OrdersDashboard />;
}
