"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  Eye,
  EyeOff,
  Filter,
  ImageOff,
  Loader2,
  LockKeyhole,
  MessageSquareReply,
  MessagesSquare,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { useReviews } from "@/hooks/useReviews";
import type { Review } from "@/types/payment";

const PAGE_SIZE = 12;

function reviewTone(rating: number) {
  if (rating >= 5) {
    return {
      card: "border-emerald-200 bg-[linear-gradient(135deg,#ffffff,#f0fdf4)]",
      line: "from-emerald-400 via-emerald-500 to-teal-400",
      icon: "bg-emerald-100 text-emerald-700",
    };
  }
  if (rating >= 4) {
    return {
      card: "border-cyan-200 bg-[linear-gradient(135deg,#ffffff,#ecfeff)]",
      line: "from-cyan-400 via-sky-500 to-blue-500",
      icon: "bg-cyan-100 text-cyan-700",
    };
  }
  if (rating >= 3) {
    return {
      card: "border-amber-200 bg-[linear-gradient(135deg,#ffffff,#fffbeb)]",
      line: "from-amber-400 via-orange-400 to-yellow-400",
      icon: "bg-amber-100 text-amber-700",
    };
  }
  return {
    card: "border-rose-200 bg-[linear-gradient(135deg,#ffffff,#fff1f2)]",
    line: "from-rose-400 via-red-500 to-orange-400",
    icon: "bg-rose-100 text-rose-700",
  };
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-navy/40 p-2 backdrop-blur-sm sm:p-4">
      <div className="max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-6">
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

        <div className="mt-5 flex flex-col-reverse gap-3 min-[380px]:flex-row min-[380px]:justify-end">
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
  const { reviews, total, loading, error, fetchReviews, updateReview, deleteReview } = useReviews();

  const [page, setPage] = useState(1);
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "visible" | "hidden">("all");
  const [ratingFilter, setRatingFilter] = useState<string>("");
  const [feedbackFilter, setFeedbackFilter] = useState<
    "all" | "private" | "no_private" | "unanswered"
  >("all");
  const [search, setSearch] = useState("");
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
    if (feedbackFilter === "private" && !r.privateFeedback?.trim()) return false;
    if (feedbackFilter === "no_private" && r.privateFeedback?.trim()) return false;
    if (feedbackFilter === "unanswered" && r.adminReply) return false;
    const normalizedSearch = search.trim().toLowerCase();
    if (
      normalizedSearch &&
      ![r.customerName, r.serviceName, r.comment, r.privateFeedback, r.bookingId].some((value) =>
        value?.toLowerCase().includes(normalizedSearch)
      )
    ) {
      return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const privateFeedbackCount = reviews.filter((review) =>
    Boolean(review.privateFeedback?.trim())
  ).length;
  const unansweredCount = reviews.filter((review) => !review.adminReply).length;
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

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
    <div className="min-h-screen bg-surface p-4 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(125deg,#071f3d,#0b4163)] p-6 text-white shadow-[0_28px_75px_rgba(11,37,69,0.2)] sm:p-8">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border-[42px] border-cyan-300/10" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-navy">
                  <MessagesSquare className="h-5 w-5" />
                </span>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-300">
                  Customer voice center
                </p>
              </div>
              <h1 className="mt-5 font-heading text-3xl font-black tracking-[-0.035em] sm:text-4xl">
                Reviews and private feedback
              </h1>
              <p className="mt-3 text-sm font-semibold leading-7 text-blue-100/70 sm:text-base">
                Public comments and confidential notes are separated clearly so your team can
                respond without exposing private customer information.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              <HeaderStat label="Reviews" value={String(total)} />
              <HeaderStat label="Private notes" value={String(privateFeedbackCount)} />
              <HeaderStat label="Needs reply" value={String(unansweredCount)} />
              <HeaderStat label="Average" value={averageRating.toFixed(1)} />
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-card border border-status-cancelled/20 bg-status-cancelled/5 px-4 py-3 text-sm font-medium text-status-cancelled">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="rounded-[1.4rem] border border-navy/[0.06] bg-surface p-4 shadow-card">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.13em] text-primary">
            <Filter className="h-4 w-4" />
            Find feedback
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-[minmax(240px,1fr)_auto_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/35" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customer, booking, service, or feedback"
                className="min-h-11 w-full rounded-xl border border-navy/10 bg-surface-soft/60 pl-10 pr-4 text-sm font-medium text-navy outline-none transition focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
            </div>
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
              value={feedbackFilter}
              onChange={(event) => setFeedbackFilter(event.target.value as typeof feedbackFilter)}
              className="min-h-11 rounded-xl border border-navy/10 bg-surface-soft/60 px-3.5 text-sm font-medium text-navy focus:border-primary/40 focus:outline-none"
            >
              <option value="all">All feedback</option>
              <option value="private">Has private note</option>
              <option value="no_private">No private note</option>
              <option value="unanswered">Needs reply</option>
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
        </div>

        {!loading && reviews.length > 0 && privateFeedbackCount === 0 && (
          <div className="flex items-start gap-3 rounded-[1.3rem] border border-amber-200 bg-amber-50 px-5 py-4">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-extrabold text-amber-900">
                No private feedback has been submitted yet
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-amber-800/80">
                The existing reviews contain public comments only. A customer can add a private note
                while submitting a new review or while editing it during the seven-day edit window.
              </p>
            </div>
          </div>
        )}

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
              <p className="text-sm font-medium text-navy/50">No reviews match these filters.</p>
            </div>
          )}

          {!loading &&
            filtered.map((review) => {
              const isBusy = busyId === review.id;
              const tone = reviewTone(review.rating);
              return (
                <div
                  key={review.id}
                  className={`relative overflow-hidden rounded-[1.6rem] border shadow-[0_16px_48px_rgba(11,37,69,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_58px_rgba(11,37,69,0.13)] ${
                    review.isVisible
                      ? tone.card
                      : "border-slate-300 bg-[linear-gradient(135deg,#ffffff,#f1f5f9)]"
                  } ${isBusy ? "opacity-60" : ""}`}
                >
                  <div
                    className={`h-1.5 bg-gradient-to-r ${
                      review.isVisible ? tone.line : "from-slate-300 to-slate-500"
                    }`}
                  />
                  <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}
                      >
                        <Star className="h-5 w-5 fill-current" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-heading text-sm font-bold text-navy">
                            {review.customerName ?? "Unknown customer"}
                          </h3>
                          <RatingBadge rating={review.rating} />
                          {review.isVerified && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                              <BadgeCheck className="h-3.5 w-3.5" />
                              Verified booking
                            </span>
                          )}
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
                          {review.serviceName ? ` · ${review.serviceName}` : ""}
                        </p>
                      </div>
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

                  <div className="grid border-t border-navy/[0.06] bg-slate-50/60 lg:grid-cols-2">
                    <section className="p-5 sm:p-6 lg:border-r lg:border-navy/[0.06]">
                      <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-primary">
                        <MessagesSquare className="h-4 w-4" />
                        Public review
                      </div>
                      <p className="mt-3 min-h-12 text-sm font-medium leading-6 text-navy/75">
                        {review.comment?.trim() || "No public comment was submitted."}
                      </p>

                      {review.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {review.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </section>

                    <section
                      className={`p-5 sm:p-6 ${
                        review.privateFeedback?.trim() ? "bg-amber-50" : "bg-white/60"
                      }`}
                    >
                      <div
                        className={`flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] ${
                          review.privateFeedback?.trim() ? "text-amber-700" : "text-slate-400"
                        }`}
                      >
                        <LockKeyhole className="h-4 w-4" />
                        Private feedback · Admin only
                      </div>
                      {review.privateFeedback?.trim() ? (
                        <div className="mt-3 rounded-xl border border-amber-200 bg-white/70 p-4">
                          <p className="text-sm font-semibold leading-6 text-amber-950">
                            {review.privateFeedback}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white/70 p-4">
                          <p className="text-sm font-medium leading-6 text-slate-400">
                            No private note was submitted with this review.
                          </p>
                        </div>
                      )}
                      <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                        <LockKeyhole className="h-3.5 w-3.5" />
                        Never displayed on public pages
                      </p>
                    </section>
                  </div>

                  {(review.beforeImages.length > 0 ||
                    review.afterImages.length > 0 ||
                    review.adminReply) && (
                    <div className="border-t border-navy/[0.06] px-5 py-5 sm:px-6">
                      {(review.beforeImages.length > 0 || review.afterImages.length > 0) && (
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                            Customer attachments
                          </p>
                          <div className="mt-3 flex gap-2 overflow-x-auto">
                            {[...review.beforeImages, ...review.afterImages].map((url, i) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={i}
                                src={url}
                                alt="Review attachment"
                                className="h-20 w-20 shrink-0 rounded-xl object-cover"
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {review.adminReply && (
                        <div className="mt-4 rounded-xl border border-primary/10 bg-primary-light/60 p-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-primary">
                            Public CleanNest reply
                          </p>
                          <p className="mt-2 text-sm leading-6 text-navy/75">{review.adminReply}</p>
                        </div>
                      )}
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

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[88px] rounded-2xl border border-white/10 bg-white/[0.08] px-3 py-3 backdrop-blur sm:px-4">
      <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-blue-100/55">
        {label}
      </p>
      <p className="mt-1 font-heading text-xl font-black text-white">{value}</p>
    </div>
  );
}
