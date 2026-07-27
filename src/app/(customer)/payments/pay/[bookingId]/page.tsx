// src/app/(customer)/payments/pay/[bookingId]/page.tsx
"use client";

import { useEffect, useState, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, ShieldCheck, ArrowLeft, Info } from "lucide-react";
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

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function PayBookingPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = usePromise(params);
  const router = useRouter();

  const [booking, setBooking] = useState<BookingSummary | null>(null);
  const [payment, setPayment] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
          setLoadError(err instanceof Error ? err.message : "Could not load this booking");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/customer/payments/booking/${bookingId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardholderName,
          cardNumber,
          expiry,
          cvv,
        }),
      });
      const json: ApiEnvelope<PaymentSummary> = await res.json();

      if (!json.success) {
        throw new Error(json.error ?? "Payment failed");
      }

      setSuccess(true);
      setTimeout(() => router.push("/payments"), 1600);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setSubmitting(false);
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
            <p className="text-sm text-navy/60">${booking.totalAmount.toFixed(2)} due</p>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-card bg-primary-light px-4 py-3 text-xs text-primary-dark">
          <Info size={16} className="mt-0.5 shrink-0" />
          <span>
            CleanNest is running in test mode — no real card network is contacted and no real money
            moves. Any card number works to simulate success; a number ending in{" "}
            <strong>0000</strong> simulates a declined payment.
          </span>
        </div>

        {success ? (
          <Alert variant="success">Payment successful! Redirecting to your payments...</Alert>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-card bg-surface p-5 shadow-card"
          >
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-navy">Cardholder name</label>
              <input
                required
                type="text"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-md border border-navy/15 px-3.5 py-2.5 text-sm text-navy outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-navy">Card number</label>
              <input
                required
                type="text"
                inputMode="numeric"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="4242 4242 4242 4242"
                className="w-full rounded-md border border-navy/15 px-3.5 py-2.5 text-sm text-navy outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1 space-y-1.5">
                <label className="block text-sm font-medium text-navy">Expiry</label>
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  className="w-full rounded-md border border-navy/15 px-3.5 py-2.5 text-sm text-navy outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="w-28 space-y-1.5">
                <label className="block text-sm font-medium text-navy">CVV</label>
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="123"
                  className="w-full rounded-md border border-navy/15 px-3.5 py-2.5 text-sm text-navy outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {submitError && <Alert variant="error">{submitError}</Alert>}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              <ShieldCheck size={16} />
              {submitting ? "Processing..." : `Pay $${booking.totalAmount.toFixed(2)} (test mode)`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
