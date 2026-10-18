import { z } from 'zod';

export const PRODUCT_CATEGORIES = [
  'Protein',
  'Creatine',
  'Pre-Workout',
  'Vitamins',
  'Amino Acids',
  'Mass Gainers',
  'Fat Burners',
  'Wellness',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const productCategorySchema = z.enum(PRODUCT_CATEGORIES);

export const productVariantSchema = z.object({
  label: z.string().trim().min(1, 'Variant label is required').max(80),
  price: z.number('Price is required').min(0, 'Price cannot be negative'),
  mrp: z.number('MRP must be a number').min(0, 'MRP cannot be negative').optional(),
  sku: z.string().trim().max(64).optional(),
  stockQty: z
    .number('Stock is required')
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .default(0),
});

export const nutritionFactSchema = z.object({
  label: z.string().trim().min(1).max(60),
  value: z.string().trim().min(1).max(60),
});

/**
 * An image source is either an absolute URL (Cloudinary / any CDN) or a
 * root-relative path to a file in /public (e.g. /products/placeholder.png).
 */
export const productImageSchema = z.union([z.url(), z.string().startsWith('/').max(300)]);

/** Payload for creating/updating a product (admin only). Slug is derived server-side. */
export const productInputSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(160),
  brand: z.string().trim().min(1, 'Brand is required').max(80),
  category: productCategorySchema,
  description: z.string().trim().min(10, 'Description is too short').max(5000),
  images: z.array(productImageSchema).max(8).default([]),
  variants: z.array(productVariantSchema).min(1, 'At least one variant is required').max(20),
  ingredients: z.string().trim().max(2000).optional(),
  nutritionFacts: z.array(nutritionFactSchema).max(40).default([]),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
});

export type ProductInput = z.infer<typeof productInputSchema>;

/** Client-side subset used when ordering: no price is ever trusted from the client. */
export const orderItemInputSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product id'),
  variantLabel: z.string().trim().min(1).max(80),
  qty: z.number().int().min(1, 'Quantity must be at least 1').max(50),
});

export type OrderItemInput = z.infer<typeof orderItemInputSchema>;
