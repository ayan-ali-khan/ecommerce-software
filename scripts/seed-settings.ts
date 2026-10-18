/**
 * Seeds the single store-settings document from env defaults if it does not exist.
 * Usage: bun run seed:settings   (idempotent — safe to run any time)
 */
import { connectDB, disconnectDB } from '@/lib/db';
import { Settings } from '@/models';

async function main(): Promise<void> {
  await connectDB();
  await Settings.syncIndexes();

  const existing = await Settings.findOne();
  if (existing) {
    console.log('[seed-settings] Settings document already exists — nothing changed.');
    process.exit(0);
  }

  await Settings.create({
    storeName: process.env.NEXT_PUBLIC_STORE_NAME ?? 'Body Boost Supplements Store',
    whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '919266510520',
    phone: process.env.NEXT_PUBLIC_PHONE_NUMBER ?? '+919266510520',
    shippingNote: '',
    emailNotifications: true,
    telegramNotifications: true,
  });
  console.log('[seed-settings] Created default settings document.');
}

main()
  .then(() => disconnectDB())
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    console.error('[seed-settings] Failed:', err);
    process.exit(1);
  });
