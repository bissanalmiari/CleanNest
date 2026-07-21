"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { OtpInput } from "@/components/ui/OtpInput";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/shared/button";

// Matches OTP_RESEND_COOLDOWN_SECONDS in src/lib/otp.ts — keep in sync so the
// button re-enables at roughly the same moment the server allows a resend.
const RESEND_COOLDOWN_SECONDS = 60;

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  // The link in the OTP email includes ?otp=..., so clicking it lands here
  // with the code already filled in — the person only needs to press "Verify".
  const otpFromQuery = searchParams.get("otp") ?? "";

  const { verifyEmail, resendOtp, loading, error, setError } = useAuth();
  const [otp, setOtp] = useState(otpFromQuery);
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Enter the full 6-digit code");
      return;
    }
    await verifyEmail({ email, otp });
  }

  async function handleResend() {
    setResent(false);
    const result = await resendOtp({ email });
    if (result) {
      setResent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold text-navy">Verify your email</h1>
        <p className="mt-1 text-sm text-navy/60">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-navy">{email || "your email"}</span>. Enter it below
          to activate your account.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {resent && !error && <Alert variant="success">A new code was sent to your email.</Alert>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <OtpInput value={otp} onChange={setOtp} />

        <Button type="submit" className="w-full" isLoading={loading}>
          Verify email
        </Button>
      </form>

      <div className="text-center text-sm text-navy/60">
        Didn&apos;t get a code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || loading}
          className="font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-navy/40 disabled:no-underline"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}