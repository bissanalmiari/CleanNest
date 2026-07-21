// Validation schemas for promo code endpoints.
// Requires zod: npm install zod
import { z } from "zod";
import { objectIdSchema } from "./common";

const promoCodeBaseSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, "Code must be at least 3 characters")
    .max(20, "Code must be at most 20 characters")
    .regex(/^[A-Z0-9_-]+$/, "Code may only contain letters, numbers, - and _"),
  discountType: z.enum(["percentage", "fixed_amount"]),
  discountValue: z.number().positive("Discount value must be greater than 0"),
  expiryDate: z.string().datetime({ message: "Invalid expiry date" }),
  maximumUses: z.number().int().min(1, "Must allow at least 1 use"),
  isActive: z.boolean().optional().default(true),
});

// POST /api/promo-codes (admin)
export const createPromoCodeSchema = promoCodeBaseSchema.refine(
  (data) => data.discountType !== "percentage" || data.discountValue <= 100,
  { message: "Percentage discount cannot exceed 100", path: ["discountValue"] }
);

// PATCH /api/promo-codes/[id] (admin) — partial update, base object without the
// cross-field refinement so individual fields can be patched independently.
export const updatePromoCodeSchema = promoCodeBaseSchema.partial();

// POST /api/promo-codes/validate — customer applying a code at checkout
export const validatePromoCodeSchema = z.object({
  code: z.string().trim().toUpperCase().min(1, "Code is required"),
  serviceId: objectIdSchema.optional(),
  bookingAmount: z.number().positive().optional(),
});

export const promoCodeIdParamSchema = z.object({
  id: objectIdSchema,
});

export type CreatePromoCodeValues = z.infer<typeof createPromoCodeSchema>;
export type UpdatePromoCodeValues = z.infer<typeof updatePromoCodeSchema>;
export type ValidatePromoCodeValues = z.infer<typeof validatePromoCodeSchema>;