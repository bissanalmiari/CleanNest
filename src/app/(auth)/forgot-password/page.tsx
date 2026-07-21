"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/validators/authValidator";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/shared/button";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { forgotPassword, loading, error } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(values: ForgotPasswordValues) {
    const result = await forgotPassword(values);
    if (result) {
      router.push(`/reset-password?email=${encodeURIComponent(values.email)}`);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold text-navy">Forgot your password?</h1>
        <p className="mt-1 text-sm text-navy/60">
          Enter your email and we&apos;ll send you a code to reset it.
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

        <Button type="submit" className="w-full" isLoading={loading}>
          Send reset code
        </Button>
      </form>

      <p className="text-center text-sm text-navy/60">
        Remembered it after all?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}