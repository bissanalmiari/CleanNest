"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Camera,
  CheckCircle2,
  Edit3,
  ImageIcon,
  Loader2,
  LockKeyhole,
  MessageSquareQuote,
  Quote,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { useReviews } from "@/hooks/useReviews";
import type { Review } from "@/types/payment";
import { ReviewForm } from "./ReviewForm";
import { RatingStars } from "./RatingStars";

interface ReviewsSectionProps {
  bookingId?: string;
  customerId?: string;
  cleanerId?: string;
  currentUserId?: string;
  canModerate?: boolean;
  onDelete?: (reviewId: string) => void;
  limit?: number;
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
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  useEffect(() => {
    void fetchReviews({ bookingId, customerId, cleanerId, limit });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, customerId, cleanerId, limit]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;
  }, [reviews]);

  async function handleDelete(review: Review) {
    const confirmed = window.confirm(
      `Delete your review for ${review.serviceName || "this service"}? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingReviewId(review.id);
    const result = await deleteReview(review.id);
    setDeletingReviewId(null);
    if (result !== null) onDelete?.(review.id);
  }

  if (loading && reviews.length === 0) {
    return (
      <div className="grid gap-5 lg:grid-cols-2" aria-label="Loading your reviews">
        {Array.from({ length: 4 }).map((_, index) => (
          <ReviewSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error && reviews.length === 0) return <Alert variant="error">{error}</Alert>;

  if (reviews.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-[2rem] border border-dashed border-primary/25 bg-white px-5 py-14 text-center shadow-card sm:px-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(30,111,217,0.09),transparent_42%)]"
        />
        <div className="relative">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light text-primary">
            <MessageSquareQuote className="h-8 w-8" />
          </span>
          <h3 className="mt-5 font-heading text-2xl font-black text-navy">
            You have not shared a review yet
          </h3>
          <p className="mx-auto mt-3 max-w-lg text-sm font-medium leading-7 text-slate-500">
            After a cleaning is completed, open the booking and share your rating, comments, and
            optional before-and-after photos.
          </p>
          <Link
            href="/bookings"
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-extrabold text-white shadow-[0_10px_28px_rgba(30,111,217,0.25)] transition hover:bg-primary-dark"
          >
            View completed bookings
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-primary/10 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
            <Star className="h-5 w-5 fill-current" />
          </span>
          <div>
            <p className="font-heading text-lg font-black text-navy">
              {averageRating.toFixed(1)} average rating
            </p>
            <p className="text-xs font-semibold text-slate-500">
              Across {reviews.length} review{reviews.length === 1 ? "" : "s"} shown
            </p>
          </div>
        </div>
        <p className="flex items-center gap-2 text-xs font-bold text-emerald-700">
          <BadgeCheck className="h-4 w-4" />
          All reviews come from completed bookings
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid items-start gap-5 lg:grid-cols-2">
        {reviews.map((review) =>
          editingReviewId === review.id ? (
            <div key={review.id} className="lg:col-span-2">
              <ReviewForm
                bookingId={review.bookingId}
                initialReview={review}
                onCancel={() => setEditingReviewId(null)}
                onSubmitted={() => {
                  setEditingReviewId(null);
                  void fetchReviews({ bookingId, customerId, cleanerId, limit });
                }}
              />
            </div>
          ) : (
            <ReviewCard
              key={review.id}
              review={review}
              isOwner={currentUserId === review.customerId}
              deleting={deletingReviewId === review.id}
              onEdit={() => setEditingReviewId(review.id)}
              onDelete={() => void handleDelete(review)}
            />
          )
        )}
      </div>

      {viewAllHref && (
        <div className="flex justify-center pt-2">
          <Link
            href={viewAllHref}
            className="group inline-flex min-h-12 items-center gap-2 rounded-xl border border-primary/20 bg-white px-6 text-sm font-bold text-primary shadow-card transition-colors hover:bg-primary-light"
          >
            View all reviews
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      )}
    </div>
  );
}

function ReviewCard({
  review,
  isOwner,
  deleting,
  onDelete,
  onEdit,
}: {
  review: Review;
  isOwner: boolean;
  deleting: boolean;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const hasGallery = review.beforeImages.length > 0 || review.afterImages.length > 0;
  const pairCount = Math.max(review.beforeImages.length, review.afterImages.length);

  return (
    <article className="group relative min-w-0 overflow-hidden rounded-[1.75rem] border border-primary/10 bg-white shadow-[0_16px_45px_rgba(11,37,69,0.08)] transition hover:border-primary/20 hover:shadow-[0_22px_60px_rgba(11,37,69,0.12)]">
      <div className="h-1.5 bg-gradient-to-r from-primary via-blue-400 to-cyan-300" />
      <Quote className="pointer-events-none absolute right-5 top-7 h-16 w-16 fill-primary/[0.03] text-primary/[0.06]" />

      <div className="relative p-5 sm:p-6">
        <div className="flex flex-col gap-4 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <RatingStars value={review.rating} size="sm" />
              <span className="text-xs font-black text-amber-600">{review.rating}.0</span>
            </div>
            <h3 className="mt-3 break-words font-heading text-lg font-black text-navy">
              {review.serviceName || "CleanNest service"}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <CalendarDays className="h-3.5 w-3.5" />
              {new Date(review.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {review.isVerified && (
            <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-extrabold text-emerald-700">
              <BadgeCheck className="h-4 w-4" />
              Verified
            </span>
          )}
        </div>

        <div className="mt-5 rounded-2xl bg-surface-soft p-4">
          <p className="whitespace-pre-wrap break-words text-sm font-medium leading-7 text-navy/70">
            {review.comment || "No public comment was added to this review."}
          </p>
        </div>

        {review.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {review.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1.5 text-[11px] font-bold text-primary"
              >
                <CheckCircle2 className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {hasGallery && (
          <div className="mt-5 border-t border-primary/10 pt-5">
            <p className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-navy/55">
              <Camera className="h-4 w-4 text-primary" />
              Your photos
            </p>
            <div className="space-y-3">
              {Array.from({ length: pairCount }).map((_, index) => (
                <div key={index} className="grid grid-cols-2 gap-3">
                  <BeforeAfterThumb label="Before" url={review.beforeImages[index]} />
                  <BeforeAfterThumb label="After" url={review.afterImages[index]} />
                </div>
              ))}
            </div>
          </div>
        )}

        {review.privateFeedback && (
          <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
            <p className="flex items-center gap-2 text-xs font-extrabold text-violet-700">
              <LockKeyhole className="h-4 w-4" />
              Your private note
            </p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm font-medium leading-6 text-navy/65">
              {review.privateFeedback}
            </p>
          </div>
        )}

        {review.adminReply && (
          <div className="mt-5 rounded-2xl border border-primary/10 bg-primary-light/60 p-4">
            <p className="flex items-center gap-2 text-xs font-extrabold text-primary">
              <Sparkles className="h-4 w-4" />
              CleanNest replied
            </p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm font-medium leading-6 text-navy/70">
              {review.adminReply}
            </p>
          </div>
        )}

        {isOwner && (
          <div className="mt-5 flex flex-col gap-3 border-t border-primary/10 pt-5 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
            <p className="text-xs font-semibold text-slate-400">
              {review.canEdit ? "Editable for seven days after posting" : "Editing period ended"}
            </p>
            <div className="flex gap-2">
              {review.canEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary-light px-4 text-xs font-extrabold text-primary transition hover:bg-primary hover:text-white min-[380px]:flex-none"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </button>
              )}
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-rose-100 px-4 text-xs font-extrabold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 min-[380px]:flex-none"
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function BeforeAfterThumb({ label, url }: { label: string; url?: string }) {
  if (!url) {
    return (
      <div className="flex aspect-[4/3] min-w-0 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-300">
        <ImageIcon className="h-5 w-5" />
        <span className="mt-1 text-[10px] font-bold">No {label.toLowerCase()} photo</span>
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] min-w-0 overflow-hidden rounded-2xl bg-slate-100">
      <Image
        src={url}
        alt={`${label} cleaning result`}
        fill
        sizes="(max-width: 768px) 45vw, 300px"
        className="object-cover transition duration-500 hover:scale-105"
      />
      <span
        className={`absolute bottom-2 left-2 rounded-lg px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow ${
          label === "After" ? "bg-emerald-500" : "bg-navy/80"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[1.75rem] border border-primary/5 bg-white shadow-card">
      <div className="h-1.5 bg-primary/10" />
      <div className="p-6">
        <div className="flex justify-between">
          <div className="space-y-3">
            <div className="h-4 w-28 rounded bg-slate-100" />
            <div className="h-5 w-44 rounded bg-slate-100" />
          </div>
          <div className="h-7 w-20 rounded-full bg-slate-100" />
        </div>
        <div className="mt-6 h-28 rounded-2xl bg-slate-100" />
        <div className="mt-5 flex gap-2">
          <div className="h-7 w-20 rounded-full bg-slate-100" />
          <div className="h-7 w-24 rounded-full bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
