import Link from 'next/link';
import {
  Beef,
  Cookie,
  Droplets,
  Dumbbell,
  Flame,
  HeartPulse,
  Package,
  Pill,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { ProductCategory } from '@/lib/validators';

const ICONS: Record<ProductCategory, LucideIcon> = {
  Protein: Beef,
  Creatine: Dumbbell,
  'Pre-Workout': Zap,
  Vitamins: Pill,
  'Amino Acids': Droplets,
  'Mass Gainers': Cookie,
  'Fat Burners': Flame,
  Wellness: HeartPulse,
};

interface CategoryCardProps {
  category: string;
  count?: number;
}

export function CategoryCard({ category, count }: CategoryCardProps) {
  const Icon = (ICONS[category as ProductCategory] ?? Package) satisfies LucideIcon;

  return (
    <Link
      href={`/products?category=${encodeURIComponent(category)}`}
      className="group flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-foreground/30 hover:bg-accent"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{category}</span>
        {typeof count === 'number' && (
          <span className="block text-xs text-muted-foreground">
            {count} product{count === 1 ? '' : 's'}
          </span>
        )}
      </span>
    </Link>
  );
}
