"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";

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
  const [status, setStatus] = useState<"checking" | "paid" | "pending" | "error">("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setErrorMessage("Missing payment session.");
      return;
    }

    let cancelled = false;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    async function verify() {
      const maximumAttempts = 5;

      for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
        try {
          const response = await fetch(
            `/api/customer/payments/verify?session_id=${encodeURIComponent(sessionId ?? "")}`,
            { cache: "no-store" }
          );
          const payload = (await response
            .json()
            .catch(() => null)) as ApiEnvelope<PaymentResult> | null;

          if (!response.ok || !payload?.success || !payload.data) {
            throw new Error(payload?.error ?? "Could not confirm payment");
          }

          if (cancelled) return;

          if (payload.data.status === "paid") {
            setStatus("paid");
            redirectTimer = setTimeout(() => router.push("/payments"), 1800);
            return;
          }

          if (attempt < maximumAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            if (cancelled) return;
            continue;
          }

          setStatus("pending");
          return;
        } catch (error) {
          if (attempt < maximumAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            if (cancelled) return;
            continue;
          }

          if (!cancelled) {
            setStatus("error");
            setErrorMessage(error instanceof Error ? error.message : "Could not confirm payment");
          }
        }
      }
    }

    void verify();
    return () => {
      cancelled = true;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [sessionId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-soft p-4 sm:p-6">
      <div className="w-full max-w-sm space-y-4 rounded-2xl bg-surface p-6 text-center shadow-card sm:p-8">
        {status === "checking" && (
          <>
            <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-primary" />
            <p className="font-heading text-lg font-semibold text-navy">Confirming your payment…</p>
            <p className="text-sm text-navy/60">
              Please keep this page open while Stripe confirms the transaction.
            </p>
          </>
        )}

        {status === "paid" && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-status-confirmed" />
            <p className="font-heading text-lg font-semibold text-navy">Payment successful</p>
            <p className="text-sm text-navy/60">Redirecting to your payments…</p>
          </>
        )}

        {status === "pending" && (
          <>
            <LoaderCircle className="mx-auto h-10 w-10 text-status-pending" />
            <p className="font-heading text-lg font-semibold text-navy">
              Payment is still processing
            </p>
            <p className="text-sm text-navy/60">
              Stripe has not finalized this payment yet. The status will update automatically when
              confirmation arrives.
            </p>
            <button
              type="button"
              onClick={() => router.push("/payments")}
              className="mt-2 min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Go to My Payments
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-status-cancelled" />
            <Alert variant="error">{errorMessage ?? "Could not confirm payment"}</Alert>
            <button
              type="button"
              onClick={() => router.push("/payments")}
              className="mt-2 min-h-11 rounded-xl border border-navy/10 px-4 py-2 text-sm text-navy hover:bg-surface-soft"
            >
              Go to My Payments
            </button>
          </>
        )}
      </div>
    </div>
  );
}
