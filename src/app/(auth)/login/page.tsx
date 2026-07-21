"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginValues } from "@/validators/authValidator";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/shared/button";

function LoginForm() {
  const { login, loading, error } = useAuth();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const justVerified = searchParams.get("verified") === "1";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginValues) {
    await login(values, redirectTo);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold text-navy">Welcome back</h1>
        <p className="mt-1 text-sm text-navy/60">Log in to manage your bookings.</p>
      </div>

      {justVerified && (
        <Alert variant="success">Your email is verified — you can log in now.</Alert>
      )}
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

        <div>
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />
          <div className="mt-2 text-right">
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" className="w-full" isLoading={loading}>
          Log in
        </Button>
      </form>

      <p className="text-center text-sm text-navy/60">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}