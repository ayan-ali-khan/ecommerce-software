import type { OrderStatus } from '@/lib/validators';
import { cn } from '@/lib/utils';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  contacted: 'Contacted',
  payment_confirmed: 'Payment confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 ring-amber-200',
  contacted: 'bg-sky-100 text-sky-800 ring-sky-200',
  payment_confirmed: 'bg-violet-100 text-violet-800 ring-violet-200',
  shipped: 'bg-cyan-100 text-cyan-800 ring-cyan-200',
  delivered: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  cancelled: 'bg-red-100 text-red-800 ring-red-200',
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        STATUS_STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
