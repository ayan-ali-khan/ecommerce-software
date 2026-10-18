import { connectDB } from '@/lib/db';
import { Settings, type SettingsDoc } from '@/models';
import type { SettingsInput } from '@/lib/validators/settings';
import type { PublicSettings } from '@/lib/store';

/**
 * Single source of truth for owner-editable store settings.
 * There is exactly one document (no filter) — created on first access if missing.
 */
export async function getSettings(): Promise<SettingsDoc> {
  await connectDB();
  const doc = await Settings.findOne().lean();
  if (!doc) {
    const created = new Settings({
      storeName: process.env.NEXT_PUBLIC_STORE_NAME ?? 'Body Boost Supplements Store',
      whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '919266510520',
      phone: process.env.NEXT_PUBLIC_PHONE_NUMBER ?? '+919266510520',
      shippingNote: '',
      emailNotifications: true,
      telegramNotifications: true,
    });
    await created.save();
    return created.toObject() as unknown as SettingsDoc;
  }
  return doc as unknown as SettingsDoc;
}

/**
 * Public view of settings used by the storefront.
 * Settings override env defaults where provided; missing settings fall back to env
 * (so the storefront is never blocked by a missing settings doc during early deploys).
 */
export async function getPublicSettings(): Promise<PublicSettings> {
  const s = await getSettings().catch(() => null);
  const envWhatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '919266510520';
  const envPhone = process.env.NEXT_PUBLIC_PHONE_NUMBER ?? '+919266510520';
  // An empty note means "not overridden" — fall back to the env address.
  // (`??` alone would keep "" and blank out the address.)
  const shippingNote = s?.shippingNote?.trim() ?? '';

  return {
    storeName: s?.storeName || process.env.NEXT_PUBLIC_STORE_NAME || 'Body Boost Supplements Store',
    whatsapp: s?.whatsappNumber || envWhatsapp,
    phone: s?.phone || envPhone,
    address:
      shippingNote ||
      process.env.NEXT_PUBLIC_STORE_ADDRESS ||
      'Vikas Puri, Pillokhadi Ka Pull, Meerut 250002',
    /** Owner-set contact address (legacy NEXT_PUBLIC_STORE_ADDRESS env). */
    storeAddress:
      process.env.NEXT_PUBLIC_STORE_ADDRESS ?? 'Vikas Puri, Pillokhadi Ka Pull, Meerut 250002',
    shippingNote,
    emailNotifications: s?.emailNotifications ?? true,
    telegramNotifications: s?.telegramNotifications ?? true,
  };
}

/** PATCHable subset: owner can only edit the values listed here. */
export async function updateSettings(input: SettingsInput): Promise<SettingsDoc> {
  await connectDB();
  const doc = await Settings.findOne();
  if (!doc) {
    const created = await Settings.create(input);
    return created.toObject() as unknown as SettingsDoc;
  }
  Object.assign(doc, input);
  await doc.save();
  return doc.toObject() as unknown as SettingsDoc;
}
