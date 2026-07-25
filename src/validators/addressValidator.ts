// Validation schemas for address endpoints.
// Requires zod: npm install zod
import { z } from "zod";
import { objectIdSchema } from "./common";

export const addressPropertyTypeSchema = z.enum([
  "apartment",
  "house",
  "office",
  "other",
]);

export const createAddressSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(50),
  city: z.string().trim().min(1, "City is required").max(100),
  area: z.string().trim().min(1, "Area is required").max(100),
  street: z.string().trim().min(1, "Street is required").max(200),
  building: z.string().trim().max(50).optional(),
  floor: z.string().trim().max(20).optional(),
  apartment: z.string().trim().max(20).optional(),
  propertyType: addressPropertyTypeSchema.optional(),
  bedrooms: z.coerce.number().int().min(0).max(30).optional(),
  bathrooms: z.coerce.number().int().min(0).max(30).optional(),
  propertySize: z.coerce.number().min(20).max(2000).optional(),
  isDefault: z.boolean().optional().default(false),
});

// All fields optional for PATCH-style partial updates.
export const updateAddressSchema = createAddressSchema.partial().extend({
  propertyType: addressPropertyTypeSchema.optional(),
  bedrooms: z.coerce.number().int().min(0).max(30).optional(),
  bathrooms: z.coerce.number().int().min(0).max(30).optional(),
  propertySize: z.coerce.number().min(20).max(2000).optional(),
  isDefault: z.boolean().optional(),
});

export const addressIdParamSchema = z.object({
  id: objectIdSchema,
});

export type CreateAddressValues = z.infer<typeof createAddressSchema>;
export type UpdateAddressValues = z.infer<typeof updateAddressSchema>;
