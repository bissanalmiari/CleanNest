"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  KeyRound,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";

import {
  loginSchema,
  type LoginValues,
} from "@/validators/authValidator";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/shared/button";

const benefits = [
  {
    icon: CalendarCheck2,
    text: "Manage all your cleaning bookings",
  },
  {
    icon: BadgeCheck,
    text: "Access trusted cleaning services",
  },
  {
    icon: ShieldCheck,
    text: "Secure account authentication",
  },
];

function LoginForm() {
  const { login, loading, error } = useAuth();

  const searchParams = useSearchParams();

  const redirectTo =
    searchParams.get("redirectTo") ?? undefined;

  const justVerified =
    searchParams.get("verified") === "1";

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
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {/* Heading */}
      <div className="text-center">
        <motion.div
          animate={{
            y: [0, -5, 0],
            rotate: [0, 3, -3, 0],
          }}
          transition={{
            duration: 3.5,
            repeat: 0,
            ease: "easeInOut",
          }}
          className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-primary via-blue-600 to-cyan-500 text-white shadow-[0_18px_45px_rgba(30,111,217,0.3)]"
        >
          <LogIn className="h-8 w-8" />

          <motion.span
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-primary shadow-md"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: 0,
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
          </motion.span>
        </motion.div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-primary">
          CleanNest account
        </p>

        <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          Welcome back
        </h1>

        <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-500">
          Sign in to manage your bookings, saved
          addresses, account details, and cleaning
          services.
        </p>
      </div>

      {/* Alerts */}
      <div className="mt-7 space-y-3">
        {justVerified && (
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
          >
            <Alert variant="success">
              Your email is verified — you can log in
              now.
            </Alert>
          </motion.div>
        )}

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
          >
            <Alert variant="error">{error}</Alert>
          </motion.div>
        )}
      </div>

      {/* Login form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-7 space-y-5"
      >
        {/* Email */}
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
            delay: 0.15,
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
        </motion.div>

        {/* Password */}
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
            delay: 0.22,
          }}
          className="rounded-2xl border border-primary/10 bg-surface-soft/70 p-4 transition-all duration-300 focus-within:border-primary/30 focus-within:bg-white focus-within:shadow-[0_12px_35px_rgba(30,111,217,0.08)]"
        >
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-primary">
            <KeyRound className="h-4 w-4" />
            Secure password
          </div>

          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />

          <div className="mt-3 flex justify-end">
            <Link
              href="/forgot-password"
              className="group inline-flex items-center gap-1.5 text-xs font-bold text-primary transition-colors hover:text-primary-dark"
            >
              Forgot password?

              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
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
            delay: 0.3,
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
              Log in to CleanNest
              {!loading && (
                <ArrowRight className="h-5 w-5" />
              )}
            </span>
          </Button>
        </motion.div>
      </form>

      {/* Security note */}
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
          delay: 0.38,
        }}
        className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3.5"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
          <ShieldCheck className="h-5 w-5" />
        </span>

        <div>
          <p className="text-sm font-bold text-emerald-800">
            Your account is protected
          </p>

          <p className="mt-1 text-xs leading-5 text-emerald-700/70">
            CleanNest uses secure authentication to
            protect your personal and booking
            information.
          </p>
        </div>
      </motion.div>

      {/* Benefits */}
      <div className="mt-6 grid gap-2 sm:grid-cols-3">
        {benefits.map(
          ({ icon: Icon, text }, index) => (
            <motion.div
              key={text}
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.42 + index * 0.08,
              }}
              whileHover={{
                y: -3,
              }}
              className="rounded-xl border border-primary/10 bg-white px-3 py-3 text-center shadow-sm"
            >
              <Icon className="mx-auto h-4 w-4 text-primary" />

              <p className="mt-2 text-[11px] font-semibold leading-4 text-slate-500">
                {text}
              </p>
            </motion.div>
          ),
        )}
      </div>

      {/* Signup link */}
      <div className="mt-7 border-t border-primary/10 pt-6 text-center">
        <p className="text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="group inline-flex items-center gap-1 font-bold text-primary transition-colors hover:text-primary-dark"
          >
            Create an account

            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

function LoginLoadingFallback() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="mx-auto h-16 w-16 rounded-[1.4rem] bg-slate-200" />

      <div className="mx-auto h-8 w-52 rounded-lg bg-slate-200" />

      <div className="mx-auto h-4 w-72 max-w-full rounded bg-slate-100" />

      <div className="space-y-5 pt-4">
        <div className="h-28 rounded-2xl bg-slate-100" />
        <div className="h-32 rounded-2xl bg-slate-100" />
        <div className="h-14 rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoadingFallback />}>
      <LoginForm />
    </Suspense>
  );
}