"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, LoaderCircle } from "lucide-react";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { Alert } from "@/components/ui/Alert";
import type { Review } from "@/types/payment";

export default function LeaveReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [submitted, setSubmitted] = useState<Review | null>(null);
  const [eligibility, setEligibility] = useState<
    "loading" | "eligible" | "reviewed" | "unavailable"
  >("loading");
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkEligibility() {
      try {
        const response = await fetch("/api/customer/bookings", {
          credentials: "include",
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          success?: boolean;
          data?: {
            bookings?: Array<{
              id?: string;
              status?: string;
              canReview?: boolean;
              review?: { id?: string } | null;
            }>;
          };
          error?: string;
        };
        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? "Unable to verify this booking.");
        }

        const booking = payload.data?.bookings?.find((item) => item.id === params.id);
        if (cancelled) return;
        if (!booking || booking.status !== "completed") {
          setEligibility("unavailable");
        } else if (booking.review?.id) {
          setEligibility("reviewed");
        } else if (booking.canReview) {
          setEligibility("eligible");
        } else {
          setEligibility("unavailable");
        }
      } catch (error) {
        if (!cancelled) {
          setEligibility("unavailable");
          setEligibilityError(
            error instanceof Error ? error.message : "Unable to verify this booking."
          );
        }
      }
    }

    void checkEligibility();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  function handleSubmitted(review: Review) {
    setSubmitted(review);
    setTimeout(() => router.push("/reviews"), 1200);
  }

  return (
    <main className="min-h-screen bg-[#f3f7fc] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/bookings"
          className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to bookings
        </Link>
        {eligibility === "loading" ? (
          <div className="rounded-[1.8rem] border border-primary/10 bg-white p-10 text-center shadow-card">
            <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm font-semibold text-slate-500">
              Checking your completed booking…
            </p>
          </div>
        ) : submitted ? (
          <div className="rounded-[1.8rem] border border-emerald-200 bg-white p-8 text-center shadow-card">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h1 className="mt-4 font-heading text-2xl font-black text-navy">
              Thank you for your feedback
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Your verified review has been published. Redirecting to your reviews…
            </p>
          </div>
        ) : eligibility === "reviewed" ? (
          <div className="rounded-[1.8rem] border border-emerald-200 bg-white p-8 text-center shadow-card">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h1 className="mt-4 font-heading text-2xl font-black text-navy">
              You already reviewed this booking
            </h1>
            <Link
              href="/reviews"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-navy px-5 text-sm font-extrabold text-white"
            >
              View my reviews
            </Link>
          </div>
        ) : eligibility === "eligible" ? (
          <ReviewForm bookingId={params.id} onSubmitted={handleSubmitted} />
        ) : (
          <Alert variant="error">
            {eligibilityError ?? "A review becomes available after this booking is completed."}
          </Alert>
        )}
      </div>
    </main>
  );
}
