// src/app/(customer)/payments/success/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, LoaderCircle } from "lucide-react";
import { Alert } from "@/components/ui/Alert";

interface PaymentResult {
  status: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState<"checking" | "paid" | "pending" | "error">(
    "checking"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setErrorMessage("Missing payment session.");
      return;
    }

    let cancelled = false;

    async function verify() {
      try {
        const res = await fetch(
          `/api/customer/payments/verify?session_id=${encodeURIComponent(
            sessionId ?? ""
          )}`
        );
        const json: ApiEnvelope<PaymentResult> = await res.json();

        if (!json.success || !json.data) {
          throw new Error(json.error ?? "Could not confirm payment");
        }

        if (cancelled) return;

        if (json.data.status === "paid") {
          setStatus("paid");
          setTimeout(() => router.push("/payments"), 1800);
        } else {
          // Stripe hasn't finished processing yet (rare, e.g. delayed
          // methods) — the webhook will catch up shortly.
          setStatus("pending");
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(
            err instanceof Error ? err.message : "Could not confirm payment"
          );
        }
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [sessionId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-soft p-6">
      <div className="w-full max-w-sm space-y-4 rounded-card bg-surface p-8 text-center shadow-card">
        {status === "checking" && (
          <>
            <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-primary" />
            <p className="font-heading text-lg font-semibold text-navy">
              Confirming your payment...
            </p>
          </>
        )}

        {status === "paid" && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-status-confirmed" />
            <p className="font-heading text-lg font-semibold text-navy">
              Payment successful
            </p>
            <p className="text-sm text-navy/60">
              Redirecting to your payments...
            </p>
          </>
        )}

        {status === "pending" && (
          <>
            <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-status-pending" />
            <p className="font-heading text-lg font-semibold text-navy">
              Payment is still processing
            </p>
            <p className="text-sm text-navy/60">
              This can take a moment — check your payments page shortly.
            </p>
            <button
              type="button"
              onClick={() => router.push("/payments")}
              className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Go to My Payments
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-status-cancelled" />
            <Alert variant="error">
              {errorMessage ?? "Could not confirm payment"}
            </Alert>
            <button
              type="button"
              onClick={() => router.push("/payments")}
              className="mt-2 rounded-md border border-navy/10 px-4 py-2 text-sm text-navy hover:bg-surface-soft"
            >
              Go to My Payments
            </button>
          </>
        )}
      </div>
    </div>
  );
}
