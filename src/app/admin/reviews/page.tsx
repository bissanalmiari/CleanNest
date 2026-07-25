"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Star,
  MessageSquareReply,
  Eye,
  EyeOff,
  Trash2,
  ImageOff,
  Loader2,
} from "lucide-react";
import { useReviews } from "@/hooks/useReviews";
import type { Review } from "@/types/payment";

const PAGE_SIZE = 12;

function RatingBadge({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600">
      <Star size={13} className="fill-current" />
      {rating.toFixed(1)}
    </span>
  );
}

function ReplyModal({
  review,
  onClose,
  onSubmit,
  submitting,
}: {
  review: Review;
  onClose: () => void;
  onSubmit: (text: string) => void;
  submitting: boolean;
}) {
  const [text, setText] = useState(review.adminReply ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl">
        <h3 className="font-heading text-lg font-semibold text-navy">
          Reply to {review.customerName ?? "this customer"}
        </h3>
        <p className="mt-1 text-sm text-navy/55">
          Your reply is shown publicly underneath their review.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Thank you for the feedback..."
          className="mt-4 w-full rounded-xl border border-navy/10 bg-surface-soft/60 p-3 text-sm text-navy focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
        />

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-navy/60 transition-colors hover:bg-navy/5"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting || text.trim().length === 0}
            onClick={() => onSubmit(text.trim())}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(30,111,217,0.25)] transition-all hover:brightness-105 disabled:opacity-50"
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            Save Reply
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminReviewsPage() {
  const { reviews, total, loading, error, fetchReviews, updateReview, deleteReview } =
    useReviews();

  const [page, setPage] = useState(1);
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "visible" | "hidden">("all");
  const [ratingFilter, setRatingFilter] = useState<string>("");
  const [replyingTo, setReplyingTo] = useState<Review | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchReviews({ page, limit: PAGE_SIZE });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = reviews.filter((r) => {
    if (visibilityFilter === "visible" && !r.isVisible) return false;
    if (visibilityFilter === "hidden" && r.isVisible) return false;
    if (ratingFilter && r.rating !== Number(ratingFilter)) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function handleToggleVisibility(review: Review) {
    setBusyId(review.id);
    await updateReview(review.id, { isVisible: !review.isVisible } as never);
    setBusyId(null);
  }

  async function handleDelete(review: Review) {
    const confirmed = window.confirm(
      `Delete this review by ${review.customerName ?? "this customer"}? This cannot be undone.`
    );
    if (!confirmed) return;
    setBusyId(review.id);
    await deleteReview(review.id);
    setBusyId(null);
  }

  async function handleReplySubmit(text: string) {
    if (!replyingTo) return;
    setBusyId(replyingTo.id);
    await updateReview(replyingTo.id, { adminReply: text } as never);
    setBusyId(null);
    setReplyingTo(null);
  }

  return (
    <div className="min-h-screen bg-surface p-6 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_6px_16px_rgba(30,111,217,0.35)]">
            <Star size={21} strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-navy">
              Customer Reviews
            </h1>
            <p className="mt-0.5 text-sm text-navy/55">
              Reply to feedback, hide inappropriate reviews, or remove them entirely.
            </p>
          </div>

          {!loading && (
            <span className="ml-auto flex items-center gap-1.5 rounded-full border border-navy/10 bg-surface px-3.5 py-1.5 text-sm font-semibold text-navy">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {total} {total === 1 ? "review" : "reviews"}
            </span>
          )}
        </div>

        {error && (
          <div className="rounded-card border border-status-cancelled/20 bg-status-cancelled/5 px-4 py-3 text-sm font-medium text-status-cancelled">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 rounded-card border border-navy/[0.06] bg-surface p-3.5 shadow-card">
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value as typeof visibilityFilter)}
            className="rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm font-medium text-navy focus:border-primary/40 focus:outline-none"
          >
            <option value="all">All visibility</option>
            <option value="visible">Visible only</option>
            <option value="hidden">Hidden only</option>
          </select>

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 py-2.5 text-sm font-medium text-navy focus:border-primary/40 focus:outline-none"
          >
            <option value="">All ratings</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r} star{r === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </div>

        {/* List */}
        <div className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center rounded-card border border-navy/[0.06] bg-surface py-16 text-navy/40">
              <Loader2 className="animate-spin" size={22} />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-navy/[0.06] bg-surface py-16 text-center">
              <ImageOff className="text-navy/25" size={28} />
              <p className="text-sm font-medium text-navy/50">
                No reviews match these filters.
              </p>
            </div>
          )}

          {!loading &&
            filtered.map((review) => {
              const isBusy = busyId === review.id;
              return (
                <div
                  key={review.id}
                  className={`rounded-card border p-5 shadow-card transition-opacity ${
                    review.isVisible
                      ? "border-navy/[0.06] bg-surface"
                      : "border-status-cancelled/15 bg-status-cancelled/[0.03]"
                  } ${isBusy ? "opacity-60" : ""}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-heading text-sm font-bold text-navy">
                          {review.customerName ?? "Unknown customer"}
                        </h3>
                        <RatingBadge rating={review.rating} />
                        {!review.isVisible && (
                          <span className="rounded-full bg-status-cancelled/10 px-2.5 py-1 text-xs font-bold text-status-cancelled">
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-navy/45">
                        {new Date(review.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                        {" · Booking "}
                        {review.bookingId.slice(-6)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setReplyingTo(review)}
                        title="Reply"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-navy/50 transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50"
                      >
                        <MessageSquareReply size={16} />
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleToggleVisibility(review)}
                        title={review.isVisible ? "Hide review" : "Show review"}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-navy/50 transition-colors hover:bg-amber-500/10 hover:text-amber-600 disabled:opacity-50"
                      >
                        {review.isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDelete(review)}
                        title="Delete review"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-navy/50 transition-colors hover:bg-status-cancelled/10 hover:text-status-cancelled disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {review.comment && (
                    <p className="mt-3 text-sm leading-6 text-navy/75">{review.comment}</p>
                  )}

                  {(review.beforeImages.length > 0 || review.afterImages.length > 0) && (
                    <div className="mt-3 flex gap-2 overflow-x-auto">
                      {[...review.beforeImages, ...review.afterImages].map((url, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={url}
                          alt="Review attachment"
                          className="h-16 w-16 shrink-0 rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  )}

                  {review.adminReply && (
                    <div className="mt-4 rounded-xl bg-primary-light/60 p-3.5">
                      <p className="text-xs font-bold uppercase tracking-wide text-primary">
                        Admin reply
                      </p>
                      <p className="mt-1 text-sm leading-6 text-navy/75">{review.adminReply}</p>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-xl border border-navy/10 px-3.5 py-2 text-sm font-semibold text-navy transition-colors hover:bg-navy/5 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-navy/50">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-navy/10 px-3.5 py-2 text-sm font-semibold text-navy transition-colors hover:bg-navy/5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {replyingTo && (
        <ReplyModal
          review={replyingTo}
          onClose={() => setReplyingTo(null)}
          onSubmit={handleReplySubmit}
          submitting={busyId === replyingTo.id}
        />
      )}
    </div>
  );
}
