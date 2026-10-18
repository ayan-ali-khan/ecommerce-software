import { z } from 'zod';

/** Mongo ObjectId string (24 hex chars). */
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const PRODUCT_SORTS = ['newest', 'price_asc', 'price_desc'] as const;
export const productSortSchema = z.enum(PRODUCT_SORTS);
export type ProductSort = (typeof PRODUCT_SORTS)[number];

/** Query accepted by GET /api/products */
export const productListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(60).optional(),
  sort: productSortSchema.default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
