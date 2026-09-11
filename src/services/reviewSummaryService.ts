// reviewSummaryService: generates and caches an AI summary of a cleaner's
// most recent reviews. Route handlers stay thin and just call into this
// file, matching the pattern in reviewService.ts.
import "server-only";
import { connectDB } from "@/lib/db";
import Review from "@/models/Review";
import CleanerAssignment from "@/models/CleanerAssignment";
import CleanerReviewSummary from "@/models/CleanerReviewSummary";
import User from "@/models/User";
import { AppError, NotFoundError } from "@/lib/apiError";
import { summarizeReviews } from "@/lib/gemini";

const REVIEWS_TO_SUMMARIZE = 20;
const MIN_SUMMARY_LENGTH = 20;
const MAX_SUMMARY_LENGTH = 800;
const NO_REVIEWS_SUMMARY = "This cleaner doesn't have any published reviews yet.";
const GENERATION_FAILED_SUMMARY = "Summary is temporarily unavailable. Please check back soon.";

export interface CleanerReviewSummaryResult {
  aiSummary: string;
  summaryGeneratedAt: string | null;
  reviewCount: number;
  isFallback: boolean;
}

async function getRecentVisibleReviews(cleanerId: string) {
  // Reviews don't store cleanerId directly — resolve it via CleanerAssignment,
  // same as reviewService.listReviews.
  const assignments = await CleanerAssignment.find({ cleanerId }).select("bookingId").lean();
  const bookingIds = assignments.map((assignment) => assignment.bookingId);
  if (bookingIds.length === 0) return [];

  return Review.find({ bookingId: { $in: bookingIds }, isVisible: true })
    .sort({ createdAt: -1 })
    .limit(REVIEWS_TO_SUMMARIZE)
    .select("rating comment createdAt")
    .lean();
}

/** Rejects empty, too-short/too-long, or obviously non-prose (e.g. raw JSON) AI output. */
function isValidSummary(text: string | null | undefined): text is string {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length < MIN_SUMMARY_LENGTH || trimmed.length > MAX_SUMMARY_LENGTH) return false;
  if (/^[{[]/.test(trimmed)) return false;
  return true;
}

/**
 * Returns a cached AI summary of a cleaner's last 20 (visible) reviews,
 * regenerating it only when a new review has arrived since the cached one
 * was generated. Falls back to the last good summary (or a generic message)
 * if the AI call fails or returns malformed output, so a profile page never
 * breaks because of this.
 */
export async function getCleanerReviewSummary(
  cleanerId: string
): Promise<CleanerReviewSummaryResult> {
  await connectDB();

  const cleaner = await User.findOne({ _id: cleanerId, role: "cleaner" }).select("_id");
  if (!cleaner) throw new NotFoundError("Cleaner not found");

  const reviews = await getRecentVisibleReviews(cleanerId);
  if (reviews.length === 0) {
    return {
      aiSummary: NO_REVIEWS_SUMMARY,
      summaryGeneratedAt: null,
      reviewCount: 0,
      isFallback: true,
    };
  }

  // Non-null: `reviews.length === 0` returned above.
  const latestReview = reviews[0]!;

  const existing = await CleanerReviewSummary.findOne({ cleanerId });
  const isFresh = existing?.lastReviewId.toString() === latestReview._id.toString();

  if (isFresh && existing) {
    return {
      aiSummary: existing.aiSummary,
      summaryGeneratedAt: existing.summaryGeneratedAt.toISOString(),
      reviewCount: existing.reviewCount,
      isFallback: false,
    };
  }

  try {
    const generated = await summarizeReviews(
      reviews.map((review) => ({ rating: review.rating, comment: review.comment ?? "" }))
    );

    if (!isValidSummary(generated)) {
      throw new AppError("AI returned an empty or malformed summary", 502);
    }

    const saved = await CleanerReviewSummary.findOneAndUpdate(
      { cleanerId },
      {
        aiSummary: generated.trim(),
        summaryGeneratedAt: new Date(),
        reviewCount: reviews.length,
        lastReviewId: latestReview._id,
      },
      { upsert: true, new: true }
    );

    return {
      aiSummary: saved.aiSummary,
      summaryGeneratedAt: saved.summaryGeneratedAt.toISOString(),
      reviewCount: saved.reviewCount,
      isFallback: false,
    };
  } catch (error) {
    console.error("[reviewSummary] AI generation failed", error);

    if (existing) {
      return {
        aiSummary: existing.aiSummary,
        summaryGeneratedAt: existing.summaryGeneratedAt.toISOString(),
        reviewCount: existing.reviewCount,
        isFallback: true,
      };
    }

    return {
      aiSummary: GENERATION_FAILED_SUMMARY,
      summaryGeneratedAt: null,
      reviewCount: reviews.length,
      isFallback: true,
    };
  }
}
