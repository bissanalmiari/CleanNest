"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordValues } from "@/validators/authValidator";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { OtpInput } from "@/components/ui/OtpInput";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/shared/button";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") ?? "";
  // The link in the OTP email includes ?otp=..., so clicking it lands here
  // with the code already filled in — the person only needs a new password.
  const otpFromQuery = searchParams.get("otp") ?? "";

  const { resetPassword, loading, error } = useAuth();
  const [otp, setOtp] = useState(otpFromQuery);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: emailFromQuery, otp: otpFromQuery },
  });

  function handleOtpChange(value: string) {
    setOtp(value);
    setValue("otp", value, { shouldValidate: true });
  }

  async function onSubmit(values: ResetPasswordValues) {
    await resetPassword({ ...values, otp });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold text-navy">Reset your password</h1>
        <p className="mt-1 text-sm text-navy/60">
          Enter the code we emailed you along with your new password.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <OtpInput value={otp} onChange={handleOtpChange} error={errors.otp?.message} />

        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          error={errors.confirmNewPassword?.message}
          {...register("confirmNewPassword")}
        />

        <Button type="submit" className="w-full" isLoading={loading}>
          Reset password
        </Button>
      </form>

      <p className="text-center text-sm text-navy/60">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}