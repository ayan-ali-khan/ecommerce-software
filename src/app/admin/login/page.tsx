import type { Metadata } from 'next';
import Link from 'next/link';
import { Dumbbell } from 'lucide-react';
import { STORE } from '@/lib/store';
import { getPublicSettings } from '@/lib/queries/settings';
import { LoginForm } from '@/components/admin/login-form';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Admin sign-in.',
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const storeName = (await getPublicSettings().catch(() => null))?.storeName ?? STORE.name;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-muted/40 px-4 py-10">
      <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          {' '}
          <Dumbbell className="h-5 w-5" aria-hidden="true" />
        </span>
        {storeName}
      </Link>

      <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-bold">Admin sign in</h1>
        <p className="mb-6 text-sm text-muted-foreground">Orders dashboard — owner access only.</p>
        <LoginForm next={next ?? '/admin'} />
      </div>

      <p className="text-xs text-muted-foreground">Session expires after 7 days.</p>
    </div>
  );
}
