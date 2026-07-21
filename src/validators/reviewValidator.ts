// Validation schemas for review endpoints.
// Requires zod: npm install zod
import { z } from "zod";
import { objectIdSchema } from "./common";

// POST /api/reviews — customer leaving a review for a completed booking
export const createReviewSchema = z.object({
  bookingId: objectIdSchema,
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  comment: z.string().trim().max(1000).optional(),
});

// PATCH /api/reviews/[id] — customer editing their own review
export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().trim().max(1000).optional(),
});

// PATCH /api/reviews/[id] — admin replying to a review
export const adminReplySchema = z.object({
  adminReply: z.string().trim().min(1, "Reply cannot be empty").max(1000),
});

// PATCH /api/reviews/[id] — admin hiding/showing a review
export const updateReviewVisibilitySchema = z.object({
  isVisible: z.boolean(),
});

export const reviewIdParamSchema = z.object({
  id: objectIdSchema,
});

export type CreateReviewValues = z.infer<typeof createReviewSchema>;
export type UpdateReviewValues = z.infer<typeof updateReviewSchema>;
export type AdminReplyValues = z.infer<typeof adminReplySchema>;
export type UpdateReviewVisibilityValues = z.infer<typeof updateReviewVisibilitySchema>;