// Validation schemas for review endpoints.
// Requires zod: npm install zod
import { z } from "zod";
import { objectIdSchema } from "./common";

const MAX_GALLERY_IMAGES = 5;
const urlSchema = z.string().trim().url("Invalid image URL");

// POST /api/reviews — customer leaving a review for a completed booking.
// beforeImages/afterImages are URLs already uploaded via
// POST /api/reviews/upload-image (see that route for why it's a 2-step flow).
export const createReviewSchema = z.object({
  bookingId: objectIdSchema,
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  comment: z.string().trim().max(1000).optional(),
  beforeImages: z.array(urlSchema).max(MAX_GALLERY_IMAGES).optional().default([]),
  afterImages: z.array(urlSchema).max(MAX_GALLERY_IMAGES).optional().default([]),
});

// PATCH /api/reviews/[id] — customer editing their own review
export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().trim().max(1000).optional(),
  beforeImages: z.array(urlSchema).max(MAX_GALLERY_IMAGES).optional(),
  afterImages: z.array(urlSchema).max(MAX_GALLERY_IMAGES).optional(),
});

// PATCH /api/reviews/[id] — admin replying to a review
export const adminReplySchema = z.object({
  adminReply: z.string().trim().min(1, "Reply cannot be empty").max(1000),
});

// PATCH /api/reviews/[id] — admin hiding/showing a review
export const updateReviewVisibilitySchema = z.object({
  isVisible: z.boolean(),
});

// POST /api/reviews/upload-image — one image at a time, either slot
export const reviewImageSlotSchema = z.enum(["before", "after"]);

export const reviewImageFileSchema = {
  maxSizeBytes: 5 * 1024 * 1024, // 5 MB
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
};

export const reviewIdParamSchema = z.object({
  id: objectIdSchema,
});

export const listReviewsQuerySchema = z.object({
  bookingId: objectIdSchema.optional(),
  customerId: objectIdSchema.optional(),
  cleanerId: objectIdSchema.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type CreateReviewValues = z.infer<typeof createReviewSchema>;
export type UpdateReviewValues = z.infer<typeof updateReviewSchema>;
export type AdminReplyValues = z.infer<typeof adminReplySchema>;
export type UpdateReviewVisibilityValues = z.infer<typeof updateReviewVisibilitySchema>;
export type ReviewImageSlot = z.infer<typeof reviewImageSlotSchema>;
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
