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
    .max(30, "Code must be at most 30 characters")
    .regex(/^[A-Z0-9_-]+$/, "Code may only contain letters, numbers, - and _"),
  description: z.string().trim().max(300).optional(),
  discountType: z.enum(["percentage", "fixed_amount"]),
  discountValue: z.number().positive("Discount value must be greater than 0"),
  startDate: z.string().datetime({ message: "Invalid start date" }).optional(),
  expiryDate: z.string().datetime({ message: "Invalid expiry date" }),
  minimumBookingAmount: z.number().min(0).optional(),
  maximumDiscountAmount: z.number().positive().nullable().optional(),
  maximumUses: z.number().int().min(1, "Must allow at least 1 use"),
  perCustomerLimit: z.number().int().min(1).optional(),
  applicableServiceIds: z.array(objectIdSchema).max(100).optional(),
  isActive: z.boolean().optional(),
});

// POST /api/promo-codes (admin)
export const createPromoCodeSchema = promoCodeBaseSchema
  .refine((data) => data.discountType !== "percentage" || data.discountValue <= 100, {
    message: "Percentage discount cannot exceed 100",
    path: ["discountValue"],
  })
  .refine((data) => data.discountType === "percentage" || data.maximumDiscountAmount == null, {
    message: "A maximum discount is only valid for percentage codes",
    path: ["maximumDiscountAmount"],
  })
  .refine(
    (data) =>
      !data.startDate || new Date(data.expiryDate).getTime() > new Date(data.startDate).getTime(),
    {
      message: "Expiry date must be later than the start date",
      path: ["expiryDate"],
    }
  );

// PATCH /api/promo-codes/[id] (admin) — partial update, base object without the
// cross-field refinement so individual fields can be patched independently.
export const updatePromoCodeSchema = promoCodeBaseSchema.partial();

// POST /api/promo-codes/validate — customer applying a code at checkout
export const validatePromoCodeSchema = z.object({
  code: z.string().trim().toUpperCase().min(1, "Code is required"),
  serviceId: objectIdSchema.optional(),
  bookingAmount: z.number().min(0).optional(),
});

export const promoCodeIdParamSchema = z.object({
  id: objectIdSchema,
});

export type CreatePromoCodeValues = z.infer<typeof createPromoCodeSchema>;
export type UpdatePromoCodeValues = z.infer<typeof updatePromoCodeSchema>;
export type ValidatePromoCodeValues = z.infer<typeof validatePromoCodeSchema>;
