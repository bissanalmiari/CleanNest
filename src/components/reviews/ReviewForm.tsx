"use client";

import { useState } from "react";
import { useReviews } from "@/hooks/useReviews";
import { RatingStars } from "./RatingStars";
import { BeforeAfterUpload } from "./BeforeAfterUpload";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/shared/button";
import type { Review } from "@/types/payment";

interface ImagePair {
  before: string | null;
  after: string | null;
}

interface ReviewFormProps {
  bookingId: string;
  onSubmitted: (review: Review) => void;
}

export function ReviewForm({ bookingId, onSubmitted }: ReviewFormProps) {
  const { createReview, uploadReviewImage, loading, error } = useReviews();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [pairs, setPairs] = useState<ImagePair[]>([]);
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

    const review = await createReview({
      bookingId,
      rating,
      comment: comment.trim() || undefined,
      beforeImages,
      afterImages,
    });

    if (review) onSubmitted(review);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-card bg-surface p-6 shadow-card">
      <div>
        <h2 className="mb-1 font-heading text-lg text-navy">Rate your cleaning</h2>
        <p className="text-sm text-navy/60">Tell others how it went.</p>
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-navy">Rating</span>
        <RatingStars value={rating} onChange={setRating} size="lg" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-navy" htmlFor="comment">
          Comment (optional)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="How was your experience?"
          className="w-full rounded-card border border-navy/15 px-3.5 py-2.5 text-sm text-navy outline-none transition placeholder:text-navy/35 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <BeforeAfterUpload
        bookingId={bookingId}
        pairs={pairs}
        onChange={setPairs}
        uploadImage={uploadReviewImage}
      />

      {(formError || error) && <Alert variant="error">{formError || error}</Alert>}

      <Button type="submit" isLoading={loading}>
        Submit review
      </Button>
    </form>
  );
}
