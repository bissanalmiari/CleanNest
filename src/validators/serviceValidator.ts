// Validation schemas for service catalog endpoints.
// Requires zod: npm install zod
import { z } from "zod";
import { objectIdSchema } from "./common";

// POST /api/admin/services (admin)
// Field names below intentionally mirror src/models/Service.ts exactly —
// price/durationMinutes, not basePrice/baseDurationMinutes — so a payload
// that passes this schema also satisfies the Mongoose required-field
// validators instead of failing after the fact.
export const createServiceSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may only contain lowercase letters, numbers, and hyphens"),
  shortDescription: z
    .string()
    .trim()
    .min(1, "Short description is required")
    .max(180, "Short description cannot exceed 180 characters"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(3000, "Service description cannot exceed 3000 characters"),
  category: z.string().trim().min(1, "Category is required").max(80),
  price: z.number().positive("Price must be greater than 0"),
  durationMinutes: z.number().int().min(30, "Duration must be at least 30 minutes"),
  includedSquareMeters: z.number().min(0).max(10000).optional().default(60),
  pricePerAdditionalSquareMeter: z.number().min(0).max(100).optional().default(0.4),
  minutesPerAdditionalSquareMeter: z.number().min(0).max(60).optional().default(0.75),
  features: z.array(z.string().trim().max(150)).optional().default([]),
  imageUrl: z.string().trim().optional().default(""),
  isActive: z.boolean().optional().default(true),
});

// PATCH /api/admin/services/[id] (admin)
export const updateServiceSchema = createServiceSchema.partial();

export const serviceIdParamSchema = z.object({
  id: objectIdSchema,
});

export type CreateServiceValues = z.infer<typeof createServiceSchema>;
export type UpdateServiceValues = z.infer<typeof updateServiceSchema>;
