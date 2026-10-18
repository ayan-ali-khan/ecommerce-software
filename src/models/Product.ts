import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';
import { PRODUCT_CATEGORIES } from '@/lib/validators/product';

const ProductVariantSchema = new Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 80 },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0 },
    sku: { type: String, trim: true, maxlength: 64 },
    stockQty: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const NutritionFactSchema = new Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 60 },
    value: { type: String, required: true, trim: true, maxlength: 60 },
  },
  { _id: false },
);

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    brand: { type: String, required: true, trim: true, maxlength: 80, index: true },
    category: {
      type: String,
      required: true,
      enum: [...PRODUCT_CATEGORIES],
      index: true,
    },
    description: { type: String, required: true, trim: true },
    images: { type: [String], default: [] },
    variants: { type: [ProductVariantSchema], default: [] },
    ingredients: { type: String, trim: true, maxlength: 2000 },
    nutritionFacts: { type: [NutritionFactSchema], default: [] },
    inStock: { type: Boolean, default: true, index: true },
    featured: { type: Boolean, default: false, index: true },
    /** Soft delete — never removed from the DB, hidden from the storefront. */
    isDeleted: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Full-text search across name, brand and description.
ProductSchema.index({ name: 'text', brand: 'text', description: 'text' });

export type ProductDoc = InferSchemaType<typeof ProductSchema>;

export const Product: Model<ProductDoc> =
  (models.Product as Model<ProductDoc>) ?? model<ProductDoc>('Product', ProductSchema);
