import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

export const VISITOR_ACTIVE_WINDOW_MS = 2 * 60 * 1000; // "active" = seen in the last 2 minutes
const VISITOR_TTL_SECONDS = 24 * 60 * 60; // auto-expire sessions older than a day

/**
 * Lightweight, privacy-friendly visit tracking.
 * Only an anonymous session id, a coarse device bucket and the path are stored —
 * no IP, no raw user agent, no personal data.
 */
const VisitorSessionSchema = new Schema(
  {
    sessionId: { type: String, required: true, unique: true, maxlength: 64 },
    firstSeen: { type: Date, required: true, default: Date.now },
    lastSeen: { type: Date, required: true, default: Date.now },
    path: { type: String, trim: true, maxlength: 300 },
    device: {
      type: String,
      enum: ['mobile', 'desktop', 'tablet', 'unknown'],
      default: 'unknown',
    },
  },
  { timestamps: true },
);

// MongoDB TTL monitor deletes old sessions automatically (keeps ~today's visitors for stats).
VisitorSessionSchema.index({ lastSeen: 1 }, { expireAfterSeconds: VISITOR_TTL_SECONDS });
VisitorSessionSchema.index({ lastSeen: -1 });

export type VisitorSessionDoc = InferSchemaType<typeof VisitorSessionSchema>;

export const VisitorSession: Model<VisitorSessionDoc> =
  (models.VisitorSession as Model<VisitorSessionDoc>) ??
  model<VisitorSessionDoc>('VisitorSession', VisitorSessionSchema);
