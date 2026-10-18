/**
 * Store-level constants, read from NEXT_PUBLIC env vars with safe defaults.
 * Shared by server components, client components and API routes.
 */
export const STORE = {
  name: process.env.NEXT_PUBLIC_STORE_NAME ?? 'Body Boost Supplements Store',
  /** Digits only with country code — for wa.me links. */
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '919266510520',
  /** E.164-ish — for tel: links. */
  phone: process.env.NEXT_PUBLIC_PHONE_NUMBER ?? '+919266510520',
  address: process.env.NEXT_PUBLIC_STORE_ADDRESS ?? 'Vikas Puri, Pillokhadi Ka Pull, Meerut 250002',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
} as const;

/**
 * Owner-editable settings served by Admin → Settings (see src/lib/queries/settings.ts).
 * Shape is shared between server and client so components can consume it in either world;
 * every field defaults to the env-based STORE constants above.
 */
export interface PublicSettings {
  storeName: string;
  /** Digits only with country code — for wa.me links. */
  whatsapp: string;
  /** E.164-ish — for tel: links. */
  phone: string;
  /** Owner address override (falls back to env when unset). */
  address: string;
  storeAddress: string;
  shippingNote: string;
  emailNotifications: boolean;
  telegramNotifications: boolean;
}

/** Env-derived defaults — used when no settings doc exists (or the DB is unreachable). */
export const DEFAULT_SETTINGS: PublicSettings = {
  storeName: STORE.name,
  whatsapp: STORE.whatsapp,
  phone: STORE.phone,
  address: STORE.address,
  storeAddress: STORE.address,
  shippingNote: '',
  emailNotifications: true,
  telegramNotifications: true,
};

/** Build a wa.me deep link with a prefilled message. */
export function waLink(message: string, whatsapp: string = STORE.whatsapp): string {
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
}

/** Build a tel: link. */
export function telLink(phone: string = STORE.phone): string {
  return `tel:${phone.replace(/[^+\d]/g, '')}`;
}

/** Absolute URL for the site (SEO/JSON-LD/OG). */
export function absoluteUrl(path = '/'): string {
  return new URL(path, STORE.siteUrl).toString();
}
