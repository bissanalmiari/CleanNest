"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  Mail,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";

import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/validators/authValidator";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/shared/button";

const recoverySteps = [
  {
    number: "01",
    text: "Enter your account email",
  },
  {
    number: "02",
    text: "Receive a secure reset code",
  },
  {
    number: "03",
    text: "Create a new password",
  },
];

export default function ForgotPasswordPage() {
  const router = useRouter();

  const {
    forgotPassword,
    loading,
    error,
  } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(
      forgotPasswordSchema,
    ),
  });

  async function onSubmit(
    values: ForgotPasswordValues,
  ) {
    const result =
      await forgotPassword(values);

    if (result) {
      router.push(
        `/reset-password?email=${encodeURIComponent(
          values.email,
        )}`,
      );
    }
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
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-primary via-blue-600 to-cyan-500 text-white shadow-[0_18px_45px_rgba(30,111,217,0.3)]"
        >
          <KeyRound className="h-8 w-8" />

          <motion.span
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-primary shadow-md"
            animate={{
              scale: [1, 1.25, 1],
              rotate: [0, 15, -15, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Sparkles className="h-4 w-4" />
          </motion.span>
        </motion.div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-primary">
          Account recovery
        </p>

        <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          Forgot your password?
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
          Enter the email connected to your
          CleanNest account and we will send you a
          secure code to reset your password.
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

      {/* Recovery form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-7 space-y-5"
      >
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
            delay: 0.14,
          }}
          className="rounded-2xl border border-primary/10 bg-surface-soft/70 p-4 transition-all duration-300 focus-within:border-primary/30 focus-within:bg-white focus-within:shadow-[0_12px_35px_rgba(30,111,217,0.08)]"
        >
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-primary">
            <Mail className="h-4 w-4" />
            Recovery email
          </div>

          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <div className="mt-3 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

            <p className="text-xs leading-5 text-slate-500">
              The reset code will only be sent to
              the verified email connected to your
              account.
            </p>
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
            delay: 0.22,
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
              <Send className="h-5 w-5" />

              Send Reset Code

              {!loading && (
                <ArrowRight className="h-5 w-5" />
              )}
            </span>
          </Button>
        </motion.div>
      </form>

      {/* Recovery steps */}
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
          delay: 0.3,
        }}
        className="mt-6 rounded-2xl border border-primary/10 bg-white p-4 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <LockKeyhole className="h-5 w-5 text-primary" />

          <h2 className="font-heading text-sm font-bold text-navy">
            How password recovery works
          </h2>
        </div>

        <div className="mt-4 space-y-3">
          {recoverySteps.map(
            (step, index) => (
              <motion.div
                key={step.number}
                initial={{
                  opacity: 0,
                  x: -12,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  delay:
                    0.34 +
                    index * 0.08,
                }}
                whileHover={{
                  x: 4,
                }}
                className="flex items-center gap-3 rounded-xl bg-surface-soft px-3 py-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-xs font-extrabold text-primary">
                  {step.number}
                </span>

                <span className="text-xs font-semibold text-slate-600">
                  {step.text}
                </span>

                <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-500" />
              </motion.div>
            ),
          )}
        </div>
      </motion.div>

      {/* Safety message */}
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
            Secure password recovery
          </p>

          <p className="mt-1 text-xs leading-5 text-emerald-700/70">
            CleanNest will never ask you to send
            your password or verification code to
            another person.
          </p>
        </div>
      </motion.div>

      {/* Login link */}
      <div className="mt-7 border-t border-primary/10 pt-6 text-center">
        <p className="text-sm text-slate-500">
          Remembered your password?{" "}
          <Link
            href="/login"
            className="group inline-flex items-center gap-1 font-bold text-primary transition-colors hover:text-primary-dark"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />

            Back to login
          </Link>
        </p>
      </div>
    </motion.div>
  );
}