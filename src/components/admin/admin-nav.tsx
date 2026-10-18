'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Boxes, Dumbbell, LogOut, Package, Settings } from 'lucide-react';
import { useSettings } from '@/lib/settings-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/admin/orders', label: 'Orders', icon: Package },
  { href: '/admin/products', label: 'Products', icon: Boxes },
  { href: '/admin/settings', label: 'Settings', icon: Settings as unknown as typeof Package },
] as const;

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const { storeName } = useSettings();

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      router.push('/admin/login');
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/admin/orders" className="flex items-center gap-2 font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Dumbbell className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="hidden sm:inline">{storeName} · Admin</span>
            <span className="sm:hidden">Admin</span>
          </Link>
          <nav aria-label="Admin" className="flex items-center gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                  pathname.startsWith(link.href) && 'bg-accent text-foreground',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground md:inline">{email}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            disabled={loggingOut}
            aria-label="Sign out"
          >
            <LogOut aria-hidden="true" />
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </Button>
        </div>
      </div>
    </header>
  );
}
