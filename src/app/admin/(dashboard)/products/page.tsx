import type { Metadata } from 'next';
import { ProductsDashboard } from '@/components/admin/products-dashboard';

export const metadata: Metadata = {
  title: 'Products',
  robots: { index: false, follow: false },
};

export default function AdminProductsPage() {
  return <ProductsDashboard />;
}
