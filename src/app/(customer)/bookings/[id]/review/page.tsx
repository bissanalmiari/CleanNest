"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { Alert } from "@/components/ui/Alert";
import type { Review } from "@/types/payment";

export default function LeaveReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [submitted, setSubmitted] = useState<Review | null>(null);

  function handleSubmitted(review: Review) {
    setSubmitted(review);
    setTimeout(() => router.push("/reviews"), 1200);
  }

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-4 font-heading text-xl font-semibold text-navy">Leave a Review</h1>

      {submitted ? (
        <Alert variant="success">Thanks for your feedback! Redirecting...</Alert>
      ) : (
        <ReviewForm bookingId={params.id} onSubmitted={handleSubmitted} />
      )}
    </div>
  );
}
