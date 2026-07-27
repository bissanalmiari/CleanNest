"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { motion } from "motion/react";

import { registerSchema, type RegisterValues } from "@/validators/authValidator";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/shared/button";

type SignupFormValues = z.input<typeof registerSchema>;

const accountBenefits = [
  "Secure email verification",
  "Easy booking management",
  "Protected personal information",
];

export default function SignupPage() {
  const { register: registerUser, loading, error } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "customer",
    },
  });

  async function onSubmit(values: SignupFormValues) {
    await registerUser({
      ...values,
      role: "customer",
    } as RegisterValues);
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
            y: [0, -6, 0],
            rotate: [0, 3, -3, 0],
          }}
          transition={{
            duration: 3.5,
            repeat: 0,
            ease: "easeInOut",
          }}
          className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-primary via-blue-600 to-cyan-500 text-white shadow-[0_18px_45px_rgba(30,111,217,0.3)]"
        >
          <UserRound className="h-8 w-8" />

          <motion.span
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-primary shadow-md"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 12, -12, 0],
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
          Join CleanNest
        </p>

        <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          Create your account
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
          Create your customer account and start booking trusted cleaning services in only a few
          minutes.
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
          <Alert variant="error">{error}</Alert>
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
        {/* Keeps the role available for validation and submission */}
        <input type="hidden" {...register("role")} />

        {/* Personal information */}
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
          className="rounded-2xl border border-primary/10 bg-surface-soft/70 p-4"
        >
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-primary">
            <UserRound className="h-4 w-4" />
            Personal information
          </div>

          <div className="space-y-4">
            <Input
              label="Full name"
              autoComplete="name"
              placeholder="Jane Doe"
              error={errors.name?.message}
              {...register("name")}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Mail className="h-4 w-4 text-primary" />
                  Email
                </div>

                <Input
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  {...register("email")}
                />
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Phone className="h-4 w-4 text-primary" />
                  Contact number
                </div>

                <Input
                  label="Phone (optional)"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+961 00 000 000"
                  error={errors.phone?.message}
                  {...register("phone")}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Password section */}
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
          className="rounded-2xl border border-primary/10 bg-surface-soft/70 p-4"
        >
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-primary">
            <KeyRound className="h-4 w-4" />
            Secure your account
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              error={errors.password?.message}
              {...register("password")}
            />

            <Input
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

            <p className="text-xs leading-5 text-emerald-700">
              Use at least eight characters and avoid sharing your password with anyone.
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
          <Button type="submit" className="min-h-[54px] w-full" isLoading={loading}>
            <span className="inline-flex items-center justify-center gap-2">
              Create CleanNest Account
              {!loading && <ArrowRight className="h-5 w-5" />}
            </span>
          </Button>
        </motion.div>
      </form>

      {/* Account benefits */}
      <div className="mt-6 grid gap-2 sm:grid-cols-3">
        {accountBenefits.map((benefit, index) => (
          <motion.div
            key={benefit}
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.36 + index * 0.08,
            }}
            whileHover={{
              y: -3,
            }}
            className="flex items-center gap-2 rounded-xl border border-primary/10 bg-white px-3 py-3"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />

            <span className="text-[11px] font-semibold leading-4 text-slate-500">{benefit}</span>
          </motion.div>
        ))}
      </div>

      {/* Login link */}
      <div className="mt-7 border-t border-primary/10 pt-6 text-center">
        <p className="text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="group inline-flex items-center gap-1 font-bold text-primary transition-colors hover:text-primary-dark"
          >
            Log in
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
