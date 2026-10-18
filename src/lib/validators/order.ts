import { z } from 'zod';
import { orderItemInputSchema } from './product';

export const ORDER_STATUSES = [
  'pending',
  'contacted',
  'payment_confirmed',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const orderStatusSchema = z.enum(ORDER_STATUSES);

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[\d\s-]{7,18}$/, 'Enter a valid phone number');

export const pincodeSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{4,10}$/, 'Enter a valid pincode');

/** Checkout payload. Prices/totals are NEVER accepted from the client. */
export const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2, 'Name is too short').max(100),
    phone: phoneSchema,
    email: z.union([z.email('Enter a valid email'), z.literal('')]).optional(),
    address: z.string().trim().min(5, 'Address is too short').max(300),
    city: z.string().trim().min(2, 'City is required').max(80),
    pincode: pincodeSchema,
    notes: z.string().trim().max(500).optional(),
  }),
  items: z.array(orderItemInputSchema).min(1, 'Your cart is empty').max(20),
  /** Honeypot field — must stay empty. Accepted by validation so bots learn nothing;
      the API handler silently drops such submissions. */
  website: z.string().max(200).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Admin-facing status update. */
export const orderStatusUpdateSchema = z.object({
  status: orderStatusSchema,
  note: z.string().trim().max(500).optional(),
  internalNotes: z.string().trim().max(2000).optional(),
});

export type OrderStatusUpdate = z.infer<typeof orderStatusUpdateSchema>;
