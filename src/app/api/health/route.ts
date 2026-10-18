import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Presence-only check — reports WHETHER a secret is set, never its value. */
function set(name: string): boolean {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Config readiness for optional integrations. Safe to expose: booleans only.
 * (`email`/`telegram` here mirror what Admin → Settings toggles gate at runtime.)
 */
function featureReadiness(): Record<string, 'configured' | 'unconfigured'> {
  const ready = {
    emailNotifications: set('RESEND_API_KEY') && set('RESEND_FROM_EMAIL'),
    telegramNotifications: set('TELEGRAM_BOT_TOKEN') && set('TELEGRAM_CHAT_ID'),
    cloudinaryUploads:
      set('CLOUDINARY_CLOUD_NAME') && set('CLOUDINARY_API_KEY') && set('CLOUDINARY_API_SECRET'),
    adminAuthSecret: set('AUTH_SECRET'),
  };
  return Object.fromEntries(
    Object.entries(ready).map(([key, value]) => [key, value ? 'configured' : 'unconfigured']),
  );
}

const NO_STORE = { 'Cache-Control': 'no-store' } as const;

export async function GET(): Promise<NextResponse> {
  const features = featureReadiness();
  try {
    await connectDB();
    return NextResponse.json(
      {
        success: true,
        data: {
          status: 'ok',
          database: 'connected',
          features,
          uptimeSeconds: Math.round(process.uptime()),
        },
      },
      { headers: NO_STORE },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        data: { features },
        error: { code: 'DB_UNAVAILABLE', message: 'Database not reachable' },
      },
      { status: 503, headers: NO_STORE },
    );
  }
}
