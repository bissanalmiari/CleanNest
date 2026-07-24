"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useReviews } from "@/hooks/useReviews";
import { RatingStars } from "@/components/reviews/RatingStars";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/shared/button";
import type { Review } from "@/types/payment";

const PAGE_SIZE = 10;

export default function PublicReviewsPage() {
  const { reviews, total, loading, error, fetchReviews } = useReviews();
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchReviews({ page, limit: PAGE_SIZE });
    window.scrollTo({ top: 0, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return null;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }, [reviews]);

  return (
    <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-extrabold text-navy sm:text-4xl">
          Customer Reviews
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          Real feedback from customers who booked a cleaning through CleanNest.
        </p>

        {total > 0 && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary-light px-4 py-2 text-sm font-semibold text-primary">
            <Star className="h-4 w-4 fill-current" />
            {averageRating !== null ? averageRating.toFixed(1) : "—"} average · {total} review
            {total === 1 ? "" : "s"}
          </div>
        )}
      </div>

      <div className="mt-10 space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        {loading && reviews.length === 0 && (
          <p className="text-center text-sm text-navy/50">Loading reviews...</p>
        )}

        {!loading && !error && reviews.length === 0 && (
          <p className="text-center text-sm text-navy/50">No reviews yet.</p>
        )}

        {reviews.map((review) => (
          <PublicReviewCard key={review.id} review={review} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <span className="text-sm text-navy/60">
            Page {page} of {totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </main>
  );
}

function PublicReviewCard({ review }: { review: Review }) {
  const hasGallery = review.beforeImages.length > 0 || review.afterImages.length > 0;
  const pairCount = Math.max(review.beforeImages.length, review.afterImages.length);

  return (
    <article className="rounded-card border border-navy/10 bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <RatingStars value={review.rating} size="sm" />
        <span className="shrink-0 text-xs text-navy/35">
          {new Date(review.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      {review.comment && <p className="mt-3 text-sm leading-6 text-navy/80">{review.comment}</p>}

      {hasGallery && (
        <div className="mt-4 space-y-2">
          {Array.from({ length: pairCount }).map((_, i) => (
            <div key={i} className="flex gap-2">
              <ReviewThumb label="Before" url={review.beforeImages[i]} />
              <ReviewThumb label="After" url={review.afterImages[i]} />
            </div>
          ))}
        </div>
      )}

      {review.adminReply && (
        <div className="mt-4 rounded-card bg-primary-light p-3">
          <p className="text-xs font-semibold text-primary">Response from CleanNest</p>
          <p className="mt-0.5 text-sm text-navy/80">{review.adminReply}</p>
        </div>
      )}
    </article>
  );
}

function ReviewThumb({ label, url }: { label: string; url?: string }) {
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