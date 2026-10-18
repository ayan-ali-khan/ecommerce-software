import type { Metadata } from 'next';
import { CartView } from '@/components/store/cart-view';
import { getProductBySlug } from '@/lib/queries/products';
import type { CartItem } from '@/lib/cart';

export const metadata: Metadata = {
  title: 'Your Cart',
  description: 'Review your cart and place your order — payment is confirmed personally.',
  alternates: { canonical: '/cart' },
};

interface CartPageProps {
  searchParams: Promise<{ slug?: string; variant?: string; qty?: string }>;
}

/** Resolves the /cart?slug=…&variant=…&qty=… hand-off from product pages into a cart line. */
async function resolvePendingItem(sp: {
  slug?: string;
  variant?: string;
  qty?: string;
}): Promise<CartItem | null> {
  if (!sp.slug || !sp.variant) return null;
  try {
    const product = await getProductBySlug(sp.slug);
    if (!product || !product.inStock) return null;
    const variant = product.variants.find((v) => v.label === sp.variant);
    if (!variant) return null;
    const qty = Math.min(50, Math.max(1, Math.round(Number(sp.qty) || 1)));
    return {
      productId: String(product._id),
      slug: product.slug,
      name: product.name,
      image: product.images[0] ?? '/products/placeholder.png',
      variantLabel: variant.label,
      price: variant.price,
      qty,
    };
  } catch {
    // Cart must still render even if the product lookup fails.
    return null;
  }
}

export default async function CartPage({ searchParams }: CartPageProps) {
  const pendingItem = await resolvePendingItem(await searchParams);
  return (
    <div className="container max-w-5xl py-8">
      <CartView pendingItem={pendingItem} />
    </div>
  );
}
