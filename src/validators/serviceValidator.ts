// Validation schemas for service catalog endpoints.
// Requires zod: npm install zod
import { z } from "zod";
import { objectIdSchema } from "./common";

// POST /api/services (admin)
export const createServiceSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(150),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(150)
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens"),
  category: z.string().trim().min(1, "Category is required").max(100),
  basePrice: z.number().positive("Base price must be greater than 0"),
  baseDurationMinutes: z.number().int().min(15, "Duration must be at least 15 minutes"),
  isActive: z.boolean().optional().default(true),
});

// PATCH /api/services/[id] (admin)
export const updateServiceSchema = createServiceSchema.partial();

export const serviceIdParamSchema = z.object({
  id: objectIdSchema,
});

export type CreateServiceValues = z.infer<typeof createServiceSchema>;
export type UpdateServiceValues = z.infer<typeof updateServiceSchema>;