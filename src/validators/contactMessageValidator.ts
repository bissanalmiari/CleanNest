import { z } from "zod";

export const adminContactMessageListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  status: z.enum(["new", "in_progress", "resolved"]).optional(),
  search: z.string().trim().max(200).optional(),
});

export const contactMessageIdSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, "Invalid contact message id"),
});

export const updateContactMessageSchema = z.object({
  status: z.enum(["new", "in_progress", "resolved"]),
});
