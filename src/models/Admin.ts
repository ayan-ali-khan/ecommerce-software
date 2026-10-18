import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';

const AdminSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

export type AdminDoc = InferSchemaType<typeof AdminSchema>;

export const Admin: Model<AdminDoc> =
  (models.Admin as Model<AdminDoc>) ?? model<AdminDoc>('Admin', AdminSchema);
