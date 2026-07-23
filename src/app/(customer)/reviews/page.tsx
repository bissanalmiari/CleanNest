"use client";

import { useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";

export default function CustomerReviewsPage() {
  const { user, fetchProfile } = useProfile();

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return <div className="p-6 text-sm text-navy/60">Loading...</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="font-heading text-xl font-semibold text-navy">My Reviews</h1>
      <ReviewsSection customerId={user.id} currentUserId={user.id} />
    </div>
  );
}
