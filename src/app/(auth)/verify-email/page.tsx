"use client";

import Link from "next/link";
import {
  Suspense,
  useEffect,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  KeyRound,
  Mail,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";

import {
  verifyEmailSchema,
  type VerifyEmailValues,
} from "@/validators/authValidator";
import { useAuth } from "@/hooks/useAuth";
import { OtpInput } from "@/components/ui/OtpInput";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/shared/button";

const RESEND_COOLDOWN = 60;

function maskEmail(email: string) {
  const [username, domain] = email.split("@");

  if (!username || !domain) {
    return email;
  }

  if (username.length <= 2) {
    return `${username.charAt(0)}***@${domain}`;
  }

  return `${username.slice(0, 2)}***@${domain}`;
}

function VerifyEmailForm() {
  const searchParams = useSearchParams();

  const email =
    searchParams.get("email") ?? "";

  const {
    verifyEmail,
    resendOtp,
    loading,
    error,
    setError: setAuthError,
  } = useAuth();

  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] =
    useState(RESEND_COOLDOWN);
  const [
    resendSuccess,
    setResendSuccess,
  ] = useState<string | null>(null);
  const [isResending, setIsResending] =
    useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<VerifyEmailValues>({
    resolver: zodResolver(
      verifyEmailSchema,
    ),
    defaultValues: {
      email,
      otp: "",
    },
  });

  useEffect(() => {
    setValue("email", email, {
      shouldValidate: false,
    });
  }, [email, setValue]);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCooldown((current) =>
        Math.max(current - 1, 0),
      );
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [cooldown]);

  function handleOtpChange(value: string) {
    setOtp(value);

    setValue("otp", value, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  async function onSubmit(
    values: VerifyEmailValues,
  ) {
    setResendSuccess(null);

    await verifyEmail({
      ...values,
      email,
      otp,
    });
  }

  async function handleResendOtp() {
    if (cooldown > 0 || isResending) {
      return;
    }

    if (!email) {
      setAuthError(
        "The email address is missing. Please return to signup and try again.",
      );
      return;
    }

    setAuthError(null);
    setResendSuccess(null);
    setIsResending(true);

    try {
      const result = await resendOtp({ email });

      if (result) {
        setCooldown(RESEND_COOLDOWN);
        setResendSuccess(
          "A new verification code has been sent to your email.",
        );
      }
    } finally {
      setIsResending(false);
    }
  }

  const canResend =
    cooldown === 0 &&
    !isResending &&
    !loading;

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
          <MailCheck className="h-8 w-8" />

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
          Email verification
        </p>

        <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          Verify your email
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
          Enter the six-digit verification code
          sent to your email to activate your
          CleanNest account.
        </p>
      </div>

      {/* Email information */}
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
          delay: 0.1,
        }}
        className="mt-7 flex items-center gap-3 rounded-2xl border border-primary/10 bg-primary-light/60 px-4 py-3.5"
      >
        <motion.span
          animate={{
            rotate: [0, 6, -6, 0],
          }}
          transition={{
            duration: 3,
            repeat: 0,
            ease: "easeInOut",
          }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm"
        >
          <Mail className="h-5 w-5" />
        </motion.span>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Verification code sent to
          </p>

          <p className="mt-1 truncate text-sm font-bold text-navy">
            {email
              ? maskEmail(email)
              : "Email address unavailable"}
          </p>
        </div>

        {email && (
          <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-emerald-500" />
        )}
      </motion.div>

      {/* Error message */}
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
          className="mt-5"
        >
          <Alert variant="error">
            {error}
          </Alert>
        </motion.div>
      )}

      {/* Resend success message */}
      {resendSuccess && (
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
          className="mt-5"
        >
          <Alert variant="success">
            {resendSuccess}
          </Alert>
        </motion.div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 space-y-5"
      >
        <input
          type="hidden"
          {...register("email")}
        />

        <input
          type="hidden"
          {...register("otp")}
        />

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
            delay: 0.16,
          }}
          className="rounded-2xl border border-primary/10 bg-surface-soft/70 p-4 sm:p-5"
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
                Enter all six digits from the
                verification email.
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
              Never share your verification code
              with another person.
            </p>
          </div>
        </motion.div>

        {/* Verify button */}
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
            delay: 0.24,
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
            disabled={
              !email || otp.length !== 6
            }
          >
            <span className="inline-flex items-center justify-center gap-2">
              <MailCheck className="h-5 w-5" />

              Verify Email

              {!loading && (
                <ArrowRight className="h-5 w-5" />
              )}
            </span>
          </Button>
        </motion.div>
      </form>

      {/* Resend section */}
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
          delay: 0.32,
        }}
        className="mt-6 rounded-2xl border border-primary/10 bg-white p-4 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-soft text-primary">
            {cooldown > 0 ? (
              <Clock3 className="h-5 w-5" />
            ) : (
              <RefreshCw className="h-5 w-5" />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-navy">
              Didn&apos;t receive the code?
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Check your spam folder or request a
              new verification code.
            </p>
          </div>
        </div>

        <motion.button
          type="button"
          onClick={handleResendOtp}
          disabled={!canResend}
          whileHover={
            canResend
              ? {
                  y: -2,
                }
              : undefined
          }
          whileTap={
            canResend
              ? {
                  scale: 0.98,
                }
              : undefined
          }
          className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/15 bg-primary-light px-4 text-sm font-bold text-primary transition-colors hover:border-primary/30 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              isResending
                ? "animate-spin"
                : ""
            }`}
          />

          {isResending
            ? "Sending new code..."
            : cooldown > 0
              ? `Resend available in ${cooldown}s`
              : "Resend verification code"}
        </motion.button>

        {cooldown > 0 && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary-light">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{
                width: "100%",
              }}
              animate={{
                width: `${
                  (cooldown /
                    RESEND_COOLDOWN) *
                  100
                }%`,
              }}
              transition={{
                duration: 0.3,
                ease: "linear",
              }}
            />
          </div>
        )}
      </motion.div>

      {/* Security information */}
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
          delay: 0.4,
        }}
        className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3.5"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
          <ShieldCheck className="h-5 w-5" />
        </span>

        <div>
          <p className="text-sm font-bold text-emerald-800">
            Secure account activation
          </p>

          <p className="mt-1 text-xs leading-5 text-emerald-700/70">
            Email verification protects your
            account and confirms that the email
            belongs to you.
          </p>
        </div>
      </motion.div>

      {/* Bottom navigation */}
      <div className="mt-7 flex flex-col items-center justify-between gap-4 border-t border-primary/10 pt-6 text-center sm:flex-row">
        <Link
          href="/signup"
          className="group inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />

          Back to signup
        </Link>

        <Link
          href="/login"
          className="group inline-flex items-center gap-1.5 text-sm font-bold text-primary transition-colors hover:text-primary-dark"
        >
          Go to login

          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </motion.div>
  );
}

function VerifyEmailLoadingFallback() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="mx-auto h-16 w-16 rounded-[1.4rem] bg-slate-200" />

      <div className="mx-auto h-8 w-64 max-w-full rounded-lg bg-slate-200" />

      <div className="mx-auto h-4 w-80 max-w-full rounded bg-slate-100" />

      <div className="h-16 rounded-2xl bg-slate-100" />

      <div className="h-48 rounded-2xl bg-slate-100" />

      <div className="h-14 rounded-xl bg-slate-200" />

      <div className="h-40 rounded-2xl bg-slate-100" />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <VerifyEmailLoadingFallback />
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}