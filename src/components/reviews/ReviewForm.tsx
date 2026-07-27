"use client";

import { useState } from "react";
import { Check, LockKeyhole, MessageSquareText, ShieldCheck, Sparkles } from "lucide-react";
import { useReviews } from "@/hooks/useReviews";
import { RatingStars } from "./RatingStars";
import { BeforeAfterUpload } from "./BeforeAfterUpload";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/shared/button";
import type { Review } from "@/types/payment";
import { REVIEW_TAGS } from "@/constants/reviews";

type ReviewTag = (typeof REVIEW_TAGS)[number];

function isReviewTag(value: string): value is ReviewTag {
  return (REVIEW_TAGS as readonly string[]).includes(value);
}

interface ImagePair {
  before: string | null;
  after: string | null;
}

interface ReviewFormProps {
  bookingId: string;
  initialReview?: Review;
  onSubmitted: (review: Review) => void;
  onCancel?: () => void;
}

export function ReviewForm({ bookingId, initialReview, onSubmitted, onCancel }: ReviewFormProps) {
  const { createReview, updateReview, uploadReviewImage, loading, error } = useReviews();

  const [rating, setRating] = useState(initialReview?.rating ?? 0);
  const [comment, setComment] = useState(initialReview?.comment ?? "");
  const [selectedTags, setSelectedTags] = useState<ReviewTag[]>(
    initialReview?.tags.filter(isReviewTag) ?? []
  );
  const [privateFeedback, setPrivateFeedback] = useState(initialReview?.privateFeedback ?? "");
  const [pairs, setPairs] = useState<ImagePair[]>(() => {
    if (!initialReview) return [];
    const pairCount = Math.max(initialReview.beforeImages.length, initialReview.afterImages.length);
    return Array.from({ length: pairCount }, (_, index) => ({
      before: initialReview.beforeImages[index] ?? null,
      after: initialReview.afterImages[index] ?? null,
    }));
  });
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (rating < 1) {
      setFormError("Please choose a star rating");
      return;
    }

    const beforeImages = pairs.map((p) => p.before).filter((url): url is string => !!url);
    const afterImages = pairs.map((p) => p.after).filter((url): url is string => !!url);

    const review = initialReview
      ? await updateReview(initialReview.id, {
          rating,
          comment: comment.trim(),
          tags: selectedTags,
          privateFeedback: privateFeedback.trim(),
          beforeImages,
          afterImages,
        })
      : await createReview({
          bookingId,
          rating,
          comment: comment.trim() || undefined,
          tags: selectedTags,
          privateFeedback: privateFeedback.trim() || undefined,
          beforeImages,
          afterImages,
        });

    if (review) onSubmitted(review);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-[1.8rem] border border-primary/10 bg-white shadow-[0_24px_70px_rgba(11,37,69,0.11)]"
    >
      <div className="bg-[linear-gradient(130deg,#0b2545,#1268b9)] p-6 text-white sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-300 text-navy">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.17em] text-cyan-300">
              {initialReview ? "Edit verified review" : "Verified booking"}
            </p>
            <h2 className="mt-2 font-heading text-2xl font-black">
              {initialReview ? "Update your feedback" : "How was your cleaning?"}
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-blue-100/70">
              Your feedback helps other customers and improves future visits.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-7 p-6 sm:p-8">
        <div className="text-center">
          <span className="block text-sm font-extrabold text-navy">Your overall rating</span>
          <div className="mt-3 flex justify-center">
            <RatingStars value={rating} onChange={setRating} size="lg" />
          </div>
          <p className="mt-2 min-h-5 text-sm font-bold text-primary">
            {["", "Needs improvement", "Fair", "Good", "Very good", "Excellent"][rating]}
          </p>
        </div>

        <fieldset>
          <legend className="text-sm font-extrabold text-navy">What stood out?</legend>
          <p className="mt-1 text-xs font-medium text-slate-500">Choose up to five.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {REVIEW_TAGS.map((tag) => {
              const selected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setSelectedTags((current) =>
                      selected
                        ? current.filter((value) => value !== tag)
                        : current.length < 5
                          ? [...current, tag]
                          : current
                    );
                  }}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3.5 text-xs font-extrabold transition ${
                    selected
                      ? "border-primary bg-primary text-white"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/30"
                  }`}
                >
                  {selected && <Check className="h-3.5 w-3.5" />}
                  {tag}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label
            className="flex items-center gap-2 text-sm font-extrabold text-navy"
            htmlFor="comment"
          >
            <MessageSquareText className="h-4 w-4 text-primary" />
            Share your experience <span className="font-semibold text-slate-400">(optional)</span>
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="What did you appreciate about the service?"
            className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-navy outline-none transition placeholder:text-slate-400 focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/10"
          />
          <p className="mt-1 text-right text-[11px] font-semibold text-slate-400">
            {comment.length}/1000
          </p>
        </div>

        <BeforeAfterUpload
          bookingId={bookingId}
          pairs={pairs}
          onChange={setPairs}
          uploadImage={uploadReviewImage}
        />

        <div className="rounded-2xl border border-primary/10 bg-primary-light/30 p-4">
          <label
            className="flex items-center gap-2 text-sm font-extrabold text-navy"
            htmlFor="private-feedback"
          >
            <LockKeyhole className="h-4 w-4 text-primary" />
            Private note to CleanNest{" "}
            <span className="font-semibold text-slate-400">(optional)</span>
          </label>
          <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
            This is only visible to the CleanNest team and will never appear publicly.
          </p>
          <textarea
            id="private-feedback"
            value={privateFeedback}
            onChange={(event) => setPrivateFeedback(event.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Tell us privately if anything needs attention."
            className="mt-3 w-full rounded-xl border border-primary/10 bg-white px-4 py-3 text-sm font-semibold leading-6 text-navy outline-none transition placeholder:text-slate-400 focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
          />
        </div>

        {(formError || error) && <Alert variant="error">{formError || error}</Alert>}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            You can edit your review for seven days.
          </p>
          <div className="flex gap-2">
            {onCancel && (
              <Button type="button" variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" isLoading={loading}>
              {initialReview ? "Save changes" : "Submit verified review"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
