"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useReviews } from "@/hooks/useReviews";
import { RatingStars } from "./RatingStars";
import { Alert } from "@/components/ui/Alert";
import type { Review } from "@/types/payment";

interface ReviewsSectionProps {
  /** Scope the list to one of these — pass exactly one. */
  bookingId?: string;
  customerId?: string;
  cleanerId?: string;
  /** Lets a page (e.g. the customer's own profile) allow editing/deleting. */
  currentUserId?: string;
  canModerate?: boolean; // true for admin — shows visibility toggle affordance elsewhere
  onDelete?: (reviewId: string) => void;
  /** Cap how many reviews are fetched/shown, e.g. 3 for a homepage teaser. */
  limit?: number;
  /** If set, renders a "View all reviews" link below the list pointing here. */
  viewAllHref?: string;
}

export function ReviewsSection({
  bookingId,
  customerId,
  cleanerId,
  currentUserId,
  onDelete,
  limit,
  viewAllHref,
}: ReviewsSectionProps) {
  const { reviews, loading, error, fetchReviews, deleteReview } = useReviews();

  useEffect(() => {
    fetchReviews({ bookingId, customerId, cleanerId, limit });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, customerId, cleanerId, limit]);

  async function handleDelete(reviewId: string) {
    const result = await deleteReview(reviewId);
    if (result !== null) onDelete?.(reviewId);
  }

  if (loading && reviews.length === 0) {
    return <p className="text-sm text-navy/50">Loading reviews...</p>;
  }

  if (error) return <Alert variant="error">{error}</Alert>;

  if (reviews.length === 0) {
    return <p className="text-sm text-navy/50">No reviews yet.</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          isOwner={currentUserId === review.customerId}
          onDelete={() => handleDelete(review.id)}
        />
      ))}

      {viewAllHref && (
        <div className="flex justify-center pt-2">
          <Link
            href={viewAllHref}
            className="group inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-6 py-3 text-sm font-bold text-primary shadow-card transition-colors hover:bg-primary-light"
          >
            View All Reviews
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      )}
    </div>
  );
}

function ReviewCard({
  review,
  isOwner,
  onDelete,
}: {
  review: Review;
  isOwner: boolean;
  onDelete: () => void;
}) {
  const hasGallery = review.beforeImages.length > 0 || review.afterImages.length > 0;
  const pairCount = Math.max(review.beforeImages.length, review.afterImages.length);

  return (
    <div className="rounded-card bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between">
        <RatingStars value={review.rating} size="sm" />
        {isOwner && (
          <button
            type="button"
            onClick={onDelete}
            className="text-xs text-navy/40 hover:text-status-cancelled"
          >
            Delete
          </button>
        )}
      </div>

      {review.comment && <p className="mt-2 text-sm text-navy/80">{review.comment}</p>}

      {hasGallery && (
        <div className="mt-3 space-y-2">
          {Array.from({ length: pairCount }).map((_, i) => (
            <div key={i} className="flex gap-2">
              <BeforeAfterThumb label="Before" url={review.beforeImages[i]} />
              <BeforeAfterThumb label="After" url={review.afterImages[i]} />
            </div>
          ))}
        </div>
      )}

      {review.adminReply && (
        <div className="mt-3 rounded-card bg-primary-light p-3">
          <p className="text-xs font-semibold text-primary">Response from CleanNest</p>
          <p className="mt-0.5 text-sm text-navy/80">{review.adminReply}</p>
        </div>
      )}

      <p className="mt-3 text-xs text-navy/35">
        {new Date(review.createdAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </p>
    </div>
  );
}

function BeforeAfterThumb({ label, url }: { label: string; url?: string }) {
  if (!url) return null;
  return (
    <div className="relative h-24 w-24 overflow-hidden rounded-card border border-navy/10">
      <Image src={url} alt={label} fill className="object-cover" />
      <span className="absolute bottom-0 left-0 right-0 bg-navy/60 py-0.5 text-center text-[10px] font-medium text-white">
        {label}
      </span>
    </div>
  );
}
