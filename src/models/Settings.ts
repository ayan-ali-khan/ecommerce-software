import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

const SettingsSchema = new Schema(
  {
    /** Display name shown in the storefront and admin chrome. */
    storeName: { type: String, required: true, trim: true, maxlength: 80 },
    /** WhatsApp number for wa.me links — digits only, with country code. */
    whatsappNumber: {
      type: String,
      required: true,
      trim: true,
      match: /^\d{7,15}$/,
    },
    /** Phone number for tel: links. */
    phone: { type: String, required: true, trim: true, match: /^\+?[\d\s-]{7,18}$/ },
    /** Shipping/address note surfaced in the storefront. */
    shippingNote: { type: String, trim: true, maxlength: 500, default: '' },
    /** Send new-order confirmation emails (via Resend) when configured. */
    emailNotifications: { type: Boolean, default: true },
    /** Send new-order notifications to Telegram when configured. */
    telegramNotifications: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type SettingsDoc = InferSchemaType<typeof SettingsSchema>;
export const Settings: Model<SettingsDoc> =
  (models.Settings as Model<SettingsDoc>) ?? model<SettingsDoc>('Settings', SettingsSchema);
