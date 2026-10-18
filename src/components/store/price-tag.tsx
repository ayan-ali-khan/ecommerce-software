import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface PriceTagProps {
  price: number;
  mrp?: number | null;
  className?: string;
  size?: 'sm' | 'lg';
}

/** ₹ price with optional struck-through MRP and discount percentage. */
export function PriceTag({ price, mrp, className, size = 'sm' }: PriceTagProps) {
  const discount = mrp != null && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : null;

  return (
    <div className={cn('flex flex-wrap items-baseline gap-2', className)}>
      <span className={cn('font-semibold tabular-nums', size === 'lg' ? 'text-2xl' : 'text-base')}>
        {formatPrice(price)}
      </span>
      {discount !== null && mrp != null && (
        <>
          <span className="text-sm tabular-nums text-muted-foreground line-through">
            {formatPrice(mrp)}
          </span>
          <span className="text-xs font-medium text-emerald-600">{discount}% off</span>
        </>
      )}
    </div>
  );
}
