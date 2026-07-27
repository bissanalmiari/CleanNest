// src/app/(customer)/payments/pay/[bookingId]/page.tsx
"use client";

import { useEffect, useState, use as usePromise } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, ShieldCheck, ArrowLeft, Lock } from "lucide-react";
import { Alert } from "@/components/ui/Alert";

interface ServiceRef {
  name?: string;
}

interface BookingSummary {
  _id: string;
  bookingNumber: string;
  bookingDate: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  serviceId?: ServiceRef | string | null;
}

interface PaymentSummary {
  _id: string;
  amount: number;
  status: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export default function PayBookingPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = usePromise(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const wasCanceled = searchParams.get("canceled") === "1";

  const [booking, setBooking] = useState<BookingSummary | null>(null);
  const [payment, setPayment] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [redirecting, setRedirecting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/customer/payments/booking/${bookingId}`);
        const json: ApiEnvelope<{
          booking: BookingSummary;
          payment: PaymentSummary;
        }> = await res.json();

        if (!json.success || !json.data) {
          throw new Error(json.error ?? "Could not load this booking");
        }
        if (!cancelled) {
          setBooking(json.data.booking);
          setPayment(json.data.payment);
          setLoadError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Could not load this booking"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const handlePayWithStripe = async () => {
    setRedirecting(true);
    setCheckoutError(null);

    try {
      const res = await fetch(
        `/api/customer/payments/booking/${bookingId}/checkout`,
        { method: "POST" }
      );
      const json: ApiEnvelope<{ url: string }> = await res.json();

      if (!json.success || !json.data?.url) {
        throw new Error(json.error ?? "Could not start checkout");
      }

      // Full-page redirect to Stripe's hosted Checkout page.
      window.location.href = json.data.url;
    } catch (err) {
      setCheckoutError(
        err instanceof Error ? err.message : "Could not start checkout"
      );
      setRedirecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-soft p-6">
        <div className="mx-auto max-w-md space-y-4">
          <div className="h-8 w-40 animate-pulse rounded bg-navy/10" />
          <div className="h-64 animate-pulse rounded-card bg-surface shadow-card" />
        </div>
      </div>
    );
  }

  if (loadError || !booking || !payment) {
    return (
      <div className="min-h-screen bg-surface-soft p-6">
        <div className="mx-auto max-w-md">
          <Alert variant="error">{loadError ?? "Booking not found"}</Alert>
        </div>
      </div>
    );
  }

  if (payment.status === "paid") {
    return (
      <div className="min-h-screen bg-surface-soft p-6">
        <div className="mx-auto max-w-md">
          <Alert variant="success">This booking has already been paid.</Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-soft p-6">
      <div className="mx-auto max-w-md space-y-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-medium text-navy/60 hover:text-navy"
        >
          <ArrowLeft size={15} /> Back
        </button>

        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-light text-primary">
            <CreditCard size={20} />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-semibold text-navy">
              Pay for {booking.bookingNumber}
            </h1>
            <p className="text-sm text-navy/60">
              ${booking.totalAmount.toFixed(2)} due
            </p>
          </div>
        </div>

        {wasCanceled && (
          <Alert variant="error">
            Checkout was canceled before payment completed. You can try again
            below.
          </Alert>
        )}

        <div className="space-y-4 rounded-card bg-surface p-5 shadow-card">
          <p className="text-sm text-navy/70">
            You&apos;ll be securely redirected to Stripe to enter your card
            details. CleanNest never sees or stores your card number.
          </p>

          <div className="flex items-center gap-2 rounded-md bg-navy/5 px-3 py-2 text-xs text-navy/60">
            <Lock size={14} />
            Payments are processed by Stripe, a PCI-compliant payment
            provider.
          </div>

          {checkoutError && <Alert variant="error">{checkoutError}</Alert>}

          <button
            type="button"
            disabled={redirecting}
            onClick={handlePayWithStripe}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            <ShieldCheck size={16} />
            {redirecting
              ? "Redirecting to Stripe..."
              : `Pay $${booking.totalAmount.toFixed(2)} with Stripe`}
          </button>
        </div>
      </div>
    </div>
  );
}
