// Validation schemas for payment endpoints.
// Requires zod: npm install zod
import { z } from "zod";
import { objectIdSchema } from "./common";

// POST /api/payments
export const createPaymentSchema = z.object({
  bookingId: objectIdSchema,
  amount: z.number().positive("Amount must be greater than 0"),
  method: z.enum(["cash", "card", "wallet", "bank_transfer"]),
  transactionReference: z.string().trim().max(200).optional(),
});

// PATCH /api/payments/[id] — updating status (e.g. webhook or admin action)
export const updatePaymentStatusSchema = z.object({
  status: z.enum(["unpaid", "pending", "paid", "refunded", "failed"]),
  transactionReference: z.string().trim().max(200).optional(),
  paidAt: z.string().datetime().optional(),
});

export const paymentIdParamSchema = z.object({
  id: objectIdSchema,
});

export type CreatePaymentValues = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentStatusValues = z.infer<typeof updatePaymentStatusSchema>;