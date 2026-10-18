import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/product-form';
import { getAdminProduct } from '@/lib/queries/admin-products';
import { objectIdSchema } from '@/lib/validators';

export const metadata: Metadata = {
  title: 'Edit product',
  robots: { index: false, follow: false },
};

interface AdminEditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditProductPage({ params }: AdminEditProductPageProps) {
  const { id } = await params;
  const parsed = objectIdSchema.safeParse(id.trim());
  if (!parsed.success) notFound();

  const product = await getAdminProduct(parsed.data);
  if (!product) notFound();

  return <ProductForm product={product} />;
}
