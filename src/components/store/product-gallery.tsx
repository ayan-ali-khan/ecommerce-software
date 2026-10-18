'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const PLACEHOLDER = '/products/placeholder.png';

interface ProductGalleryProps {
  images: string[];
  name: string;
  inStock: boolean;
}

export function ProductGallery({ images, name, inStock }: ProductGalleryProps) {
  const list = images.length > 0 ? images : [PLACEHOLDER];
  const [active, setActive] = useState(0);
  const current = list[active] ?? list[0] ?? PLACEHOLDER;

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
        <Image
          key={current}
          src={current}
          alt={`${name} — image ${active + 1} of ${list.length}`}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
        {!inStock && (
          <span className="absolute left-3 top-3 rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground shadow">
            Out of Stock
          </span>
        )}
      </div>

      {list.length > 1 && (
        <ul className="flex flex-wrap gap-2" role="list">
          {list.map((image, index) => (
            <li key={image}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show image ${index + 1} of ${list.length}`}
                aria-pressed={index === active}
                className={cn(
                  'relative h-20 w-20 overflow-hidden rounded-md border bg-muted transition-all',
                  index === active
                    ? 'border-primary ring-1 ring-primary'
                    : 'opacity-70 hover:opacity-100',
                )}
              >
                <Image src={image} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
