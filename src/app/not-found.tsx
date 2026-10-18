import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="text-6xl font-bold tracking-tight text-muted-foreground">404</p>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="max-w-md text-muted-foreground">
        The page you’re looking for doesn’t exist or may have moved.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Back to home
        </Link>
        <Link
          href="/products"
          className="rounded-md border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
        >
          Browse products
        </Link>
      </div>
    </div>
  );
}
