import type { Metadata } from 'next';
import { OrderDetailView } from '@/components/admin/order-detail-view';

export const metadata: Metadata = {
  title: 'Order detail',
  robots: { index: false, follow: false },
};

interface AdminOrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderPage({ params }: AdminOrderPageProps) {
  const { id } = await params;
  return <OrderDetailView id={id} />;
}
