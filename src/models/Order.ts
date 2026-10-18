import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';
import { ORDER_STATUSES } from '@/lib/validators/order';

const StatusHistoryEntrySchema = new Schema(
  {
    status: { type: String, required: true, enum: [...ORDER_STATUSES] },
    at: { type: Date, required: true, default: Date.now },
    note: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false },
);

const OrderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true, trim: true },
    variant: { type: String, required: true, trim: true },
    /** Price captured at order time (from DB, never from the client). */
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: {
      name: { type: String, required: true, trim: true, maxlength: 100 },
      phone: { type: String, required: true, trim: true, maxlength: 20 },
      email: { type: String, trim: true, lowercase: true, maxlength: 254 },
      address: { type: String, required: true, trim: true, maxlength: 300 },
      city: { type: String, required: true, trim: true, maxlength: 80 },
      pincode: { type: String, required: true, trim: true, maxlength: 10 },
      notes: { type: String, trim: true, maxlength: 500 },
    },
    items: { type: [OrderItemSchema], required: true },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: [...ORDER_STATUSES], default: 'pending' },
    statusHistory: { type: [StatusHistoryEntrySchema], default: [] },
    /** Private owner notes, never shown to the customer. */
    notes: { type: String, trim: true, maxlength: 2000 },
    source: { type: String, enum: ['website'], default: 'website' },
  },
  { timestamps: true },
);

OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ 'customer.phone': 1 });

export type OrderDoc = InferSchemaType<typeof OrderSchema>;

export const Order: Model<OrderDoc> =
  (models.Order as Model<OrderDoc>) ?? model<OrderDoc>('Order', OrderSchema);
