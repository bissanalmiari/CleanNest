"use client";

import Link from "next/link";
import {
  Suspense,
  useState,
  type FormEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  KeyRound,
  LockKeyhole,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";

import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/validators/authValidator";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { OtpInput } from "@/components/ui/OtpInput";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/shared/button";

const passwordRequirements = [
  "Use at least 8 characters",
  "Use a password you have not used before",
  "Keep your reset code private",
];

function ResetPasswordForm() {
  const searchParams = useSearchParams();

  const emailFromQuery =
    searchParams.get("email") ?? "";

  /*
    When the user opens the email reset link,
    the OTP can already be included in the URL.
  */
  const otpFromQuery =
    searchParams.get("otp") ?? "";

  const {
    resetPassword,
    loading,
    error,
  } = useAuth();

  const [otp, setOtp] =
    useState(otpFromQuery);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(
      resetPasswordSchema,
    ),
    defaultValues: {
      email: emailFromQuery,
      otp: otpFromQuery,
    },
  });

  function handleOtpChange(value: string) {
    setOtp(value);

    setValue("otp", value, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  async function onSubmit(
    values: ResetPasswordValues,
  ) {
    await resetPassword({
      ...values,
      otp,
    });
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 24,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.65,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {/* Heading */}
      <div className="text-center">
        <motion.div
          animate={{
            y: [0, -7, 0],
            rotate: [0, 3, -3, 0],
          }}
          transition={{
            duration: 3.5,
            repeat: 0,
            ease: "easeInOut",
          }}
          className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-primary via-blue-600 to-cyan-500 text-white shadow-[0_18px_45px_rgba(30,111,217,0.3)]"
        >
          <RefreshCw className="h-8 w-8" />

          <motion.span
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-primary shadow-md"
            animate={{
              scale: [1, 1.25, 1],
              rotate: [0, 15, -15, 0],
            }}
            transition={{
              duration: 2,
              repeat: 0,
              ease: "easeInOut",
            }}
          >
            <Sparkles className="h-4 w-4" />
          </motion.span>
        </motion.div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Password recovery
        </p>

        <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          Reset your password
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
          Enter the six-digit code sent to your
          email, then create a new secure password
          for your CleanNest account.
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <motion.div
          initial={{
            opacity: 0,
            y: -10,
            scale: 0.97,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          className="mt-7"
        >
          <Alert variant="error">
            {error}
          </Alert>
        </motion.div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-7 space-y-5"
      >
        {/* Account email */}
        <motion.div
          initial={{
            opacity: 0,
            x: -20,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            delay: 0.12,
          }}
          className="rounded-2xl border border-primary/10 bg-surface-soft/70 p-4 transition-all duration-300 focus-within:border-primary/30 focus-within:bg-white focus-within:shadow-[0_12px_35px_rgba(30,111,217,0.08)]"
        >
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-primary">
            <Mail className="h-4 w-4" />
            Account email
          </div>

          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register("email")}
          />

          {emailFromQuery && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

              <p className="break-all text-xs leading-5 text-slate-500">
                The reset request is connected to{" "}
                <span className="font-semibold text-navy">
                  {emailFromQuery}
                </span>
                .
              </p>
            </div>
          )}
        </motion.div>

        {/* OTP section */}
        <motion.div
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.19,
          }}
          className="rounded-2xl border border-primary/10 bg-surface-soft/70 p-4"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
              <KeyRound className="h-5 w-5" />
            </span>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
                Verification code
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Enter the six-digit code from your
                password-reset email.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <OtpInput
              value={otp}
              onChange={handleOtpChange}
              error={errors.otp?.message}
            />
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

            <p className="text-xs leading-5 text-amber-800/75">
              Do not share this verification code
              with anyone.
            </p>
          </div>
        </motion.div>

        {/* New password section */}
        <motion.div
          initial={{
            opacity: 0,
            x: 20,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            delay: 0.26,
          }}
          className="rounded-2xl border border-primary/10 bg-surface-soft/70 p-4"
        >
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-primary">
            <LockKeyhole className="h-4 w-4" />
            Create a new password
          </div>

          <div className="space-y-4">
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              error={
                errors.newPassword?.message
              }
              {...register("newPassword")}
            />

            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              error={
                errors.confirmNewPassword
                  ?.message
              }
              {...register(
                "confirmNewPassword",
              )}
            />
          </div>

          <div className="mt-4 space-y-2">
            {passwordRequirements.map(
              (requirement, index) => (
                <motion.div
                  key={requirement}
                  initial={{
                    opacity: 0,
                    x: -10,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  transition={{
                    delay:
                      0.3 +
                      index * 0.07,
                  }}
                  className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />

                  <span className="text-xs font-medium text-slate-500">
                    {requirement}
                  </span>
                </motion.div>
              ),
            )}
          </div>
        </motion.div>

        {/* Submit button */}
        <motion.div
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.34,
          }}
          whileHover={
            loading
              ? undefined
              : {
                  y: -3,
                }
          }
          whileTap={
            loading
              ? undefined
              : {
                  scale: 0.98,
                }
          }
        >
          <Button
            type="submit"
            className="min-h-[54px] w-full"
            isLoading={loading}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <KeyRound className="h-5 w-5" />

              Reset Password

              {!loading && (
                <ArrowRight className="h-5 w-5" />
              )}
            </span>
          </Button>
        </motion.div>
      </form>

      {/* Security message */}
      <motion.div
        initial={{
          opacity: 0,
          y: 15,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 0.42,
        }}
        className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3.5"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
          <ShieldCheck className="h-5 w-5" />
        </span>

        <div>
          <p className="text-sm font-bold text-emerald-800">
            Your new password is protected
          </p>

          <p className="mt-1 text-xs leading-5 text-emerald-700/70">
            After the reset succeeds, use your new
            password the next time you sign in.
          </p>
        </div>
      </motion.div>

      {/* Navigation links */}
      <div className="mt-7 flex flex-col items-center justify-between gap-4 border-t border-primary/10 pt-6 text-center sm:flex-row">
        <Link
          href="/forgot-password"
          className="group inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />

          Request another code
        </Link>

        <Link
          href="/login"
          className="group inline-flex items-center gap-1.5 text-sm font-bold text-primary transition-colors hover:text-primary-dark"
        >
          Back to login

          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </motion.div>
  );
}

function ResetPasswordLoadingFallback() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="mx-auto h-16 w-16 rounded-[1.4rem] bg-slate-200" />

      <div className="mx-auto h-8 w-64 max-w-full rounded-lg bg-slate-200" />

      <div className="mx-auto h-4 w-80 max-w-full rounded bg-slate-100" />

      <div className="space-y-5 pt-4">
        <div className="h-32 rounded-2xl bg-slate-100" />

        <div className="h-44 rounded-2xl bg-slate-100" />

        <div className="h-72 rounded-2xl bg-slate-100" />

        <div className="h-14 rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <ResetPasswordLoadingFallback />
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}