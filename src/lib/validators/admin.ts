import { z } from 'zod';
import { orderStatusSchema } from './order';
import { productCategorySchema } from './product';

/** Admin login form + POST /api/admin/login payload. */
export const adminLoginSchema = z.object({
  email: z.email('Enter a valid email').max(254),
  password: z.string().min(1, 'Password is required').max(200),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

/** Query accepted by GET /api/admin/orders */
export const adminOrderListQuerySchema = z.object({
  status: orderStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AdminOrderListQuery = z.infer<typeof adminOrderListQuerySchema>;

/** Query accepted by GET /api/admin/products */
export const adminProductListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: productCategorySchema.optional(),
  /** Include soft-deleted products in the listing. */
  includeDeleted: z.enum(['true', 'false']).default('false'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AdminProductListQuery = z.infer<typeof adminProductListQuerySchema>;
