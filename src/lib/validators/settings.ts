import { z } from 'zod';

/** Owner-editable store settings (Admin → Settings). */
export const settingsInputSchema = z.object({
  storeName: z.string().trim().min(1, 'Store name is required').max(80),
  whatsappNumber: z
    .string()
    .trim()
    .regex(/^\d{7,15}$/, 'Digits only, including country code, no +'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{7,18}$/, 'Enter a valid phone number'),
  shippingNote: z.string().trim().max(500).default(''),
  emailNotifications: z.boolean().default(true),
  telegramNotifications: z.boolean().default(true),
});

export type SettingsInput = z.infer<typeof settingsInputSchema>;
