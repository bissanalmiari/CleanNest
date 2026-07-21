"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterValues } from "@/validators/authValidator";
import { type z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/shared/button";

type SignupFormValues = z.input<typeof registerSchema>;

const ROLE_OPTIONS: { value: "customer" | "cleaner"; label: string; blurb: string }[] = [
  { value: "customer", label: "I need cleaning", blurb: "Book and manage cleanings" },
  { value: "cleaner", label: "I'm a cleaner", blurb: "Accept and complete jobs" },
];

export default function SignupPage() {
  const { register: registerUser, loading, error } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "customer" },
  });

  const selectedRole = watch("role");

  async function onSubmit(values: SignupFormValues) {
    await registerUser(values as RegisterValues);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold text-navy">Create your account</h1>
        <p className="mt-1 text-sm text-navy/60">
          Book your first cleaning in minutes — verified customers only.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Role selector — admins are never created here; they're seeded
            directly in the database (see scripts/seed.ts). Only customer
            and cleaner accounts can self-register. */}
        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-navy">I am signing up as...</span>
          <div className="grid grid-cols-2 gap-2">
            {ROLE_OPTIONS.map((option) => {
              const isSelected = selectedRole === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setValue("role", option.value, { shouldValidate: true })}
                  className={`rounded-card border px-3 py-2.5 text-left transition ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-navy/15 hover:border-navy/30"
                  }`}
                >
                  <span className="block text-sm font-semibold text-navy">{option.label}</span>
                  <span className="block text-xs text-navy/50">{option.blurb}</span>
                </button>
              );
            })}
          </div>
          {/* Keeps the value registered with react-hook-form / zod validation */}
          <input type="hidden" {...register("role")} />
        </div>

        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Jane Doe"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Phone (optional)"
          type="tel"
          autoComplete="tel"
          placeholder="+961 00 000 000"
          error={errors.phone?.message}
          {...register("phone")}
        />
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

        <Button type="submit" className="w-full" isLoading={loading}>
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-navy/60">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
