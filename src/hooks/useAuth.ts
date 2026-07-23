"use client";

// useAuth — thin client wrapper around /api/auth/*. Pages use react-hook-form
// for field-level validation (via the same zod schemas the API uses) and
// call these functions on submit; this hook just handles the network call,
// loading state, and turning API error shapes into a single `error` string.
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicUser } from "@/types/user";
import type {
  RegisterValues,
  LoginValues,
  ForgotPasswordValues,
  ResetPasswordValues,
  VerifyEmailValues,
  ResendOtpValues,
} from "@/validators/authValidator";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

async function postJson<T>(url: string, body: unknown): Promise<ApiEnvelope<T>> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json: ApiEnvelope<T> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "Something went wrong. Please try again.");
  }
  return json;
}

/**
 * Where each role lands after logging in / verifying their email.
 * Admin and cleaner pages live under real /admin and /cleaner URL prefixes
 * (see src/app/admin, src/app/cleaner) — only the customer experience is an
 * unprefixed route group. Keep this in sync with src/middleware.ts.
 */
function dashboardPathForRole(role: PublicUser["role"]): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "cleaner":
      return "/cleaner/today";
    case "customer":
    default:
      return "/dashboard";
  }
}

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Creates the account. Does NOT log the user in — email must be verified first. */
  const register = useCallback(
    (input: RegisterValues) =>
      run(async () => {
        const { data } = await postJson<{ user: PublicUser; message: string }>(
          "/api/auth/register",
          input
        );
        router.push(`/verify-email?email=${encodeURIComponent(input.email)}`);
        return data;
      }),
    [run, router]
  );

  /** Confirms the registration OTP, activates the account, and logs the user in. */
  const verifyEmail = useCallback(
    (input: VerifyEmailValues) =>
      run(async () => {
        const { data } = await postJson<{ user: PublicUser }>("/api/auth/verify-email", input);
        if (data?.user) router.push(dashboardPathForRole(data.user.role));
        return data?.user ?? null;
      }),
    [run, router]
  );

  const resendOtp = useCallback(
    (input: ResendOtpValues) => run(() => postJson<never>("/api/auth/resend-otp", input)),
    [run]
  );

  /** Rejected by the API with 403 if the account hasn't verified its email yet. */
  const login = useCallback(
    (input: LoginValues, redirectTo?: string) =>
      run(async () => {
        const { data } = await postJson<{ user: PublicUser }>("/api/auth/login", input);
        if (data?.user) router.push(redirectTo || dashboardPathForRole(data.user.role));
        return data?.user ?? null;
      }),
    [run, router]
  );

  const logout = useCallback(
    () =>
      run(async () => {
        await postJson<never>("/api/auth/logout", {});
        router.push("/login");
      }),
    [run, router]
  );

  const forgotPassword = useCallback(
    (input: ForgotPasswordValues) => run(() => postJson<never>("/api/auth/forgot-password", input)),
    [run]
  );

  const resetPassword = useCallback(
    (input: ResetPasswordValues) =>
      run(async () => {
        await postJson<never>("/api/auth/reset-password", input);
        router.push("/login");
      }),
    [run, router]
  );

  return {
    loading,
    error,
    setError,
    register,
    verifyEmail,
    resendOtp,
    login,
    logout,
    forgotPassword,
    resetPassword,
  };
}