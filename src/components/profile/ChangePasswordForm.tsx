"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

import { useForm, type FieldError, type UseFormRegisterReturn } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { changePasswordSchema, type ChangePasswordValues } from "@/validators/userValidator";

import { useProfile } from "@/hooks/useProfile";

interface ChangePasswordFormProps {
  onDone: () => void;
}

interface PasswordRequirement {
  label: string;
  satisfied: boolean;
}

interface PasswordFieldProps {
  id: string;
  label: string;
  placeholder: string;
  autoComplete: "current-password" | "new-password";

  visible: boolean;
  disabled: boolean;
  error?: FieldError;

  registration: UseFormRegisterReturn;

  onToggleVisibility: () => void;
}

export function ChangePasswordForm({ onDone }: ChangePasswordFormProps) {
  const { changePassword, loading, error, setError } = useProfile();

  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordChanged, setPasswordChanged] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,

    formState: { errors, isDirty, isValid },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),

    mode: "onChange",

    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const newPassword = watch("newPassword") ?? "";

  const confirmNewPassword = watch("confirmNewPassword") ?? "";

  const passwordRequirements = useMemo<PasswordRequirement[]>(
    () => [
      {
        label: "At least 8 characters",
        satisfied: newPassword.length >= 8,
      },
      {
        label: "Contains an uppercase letter",
        satisfied: /[A-Z]/.test(newPassword),
      },
      {
        label: "Contains a lowercase letter",
        satisfied: /[a-z]/.test(newPassword),
      },
      {
        label: "Contains a number",
        satisfied: /\d/.test(newPassword),
      },
      {
        label: "Passwords match",
        satisfied: confirmNewPassword.length > 0 && newPassword === confirmNewPassword,
      },
    ],
    [confirmNewPassword, newPassword]
  );

  const completedRequirementCount = passwordRequirements.filter(
    (requirement) => requirement.satisfied
  ).length;

  const passwordStrength = Math.round(
    (completedRequirementCount / passwordRequirements.length) * 100
  );

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  function clearSuccessTimer() {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);

      successTimerRef.current = null;
    }
  }

  function handleReset() {
    clearSuccessTimer();

    reset();

    setError(null);

    setPasswordChanged(false);

    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  }

  function handleCancel() {
    handleReset();
    onDone();
  }

  async function onSubmit(values: ChangePasswordValues) {
    setError(null);
    setPasswordChanged(false);

    clearSuccessTimer();

    const result = await changePassword(values);

    /*
     * useProfile returns undefined on a successful
     * password update and null when the request fails.
     */
    if (result === null) {
      return;
    }

    reset();

    setPasswordChanged(true);

    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);

    successTimerRef.current = setTimeout(() => {
      setPasswordChanged(false);

      successTimerRef.current = null;

      onDone();
    }, 1800);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7" noValidate>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-extrabold">Password could not be changed</p>

            <p className="mt-1 text-sm font-semibold leading-6">{error}</p>
          </div>
        </div>
      )}

      {passwordChanged && (
        <div
          aria-live="polite"
          className="overflow-hidden rounded-[1.7rem] border border-emerald-200 bg-emerald-50"
        >
          <div className="flex items-start gap-4 p-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white">
              <CheckCircle2 className="h-6 w-6" />
            </span>

            <div>
              <p className="font-heading text-xl font-black text-emerald-900">Password updated</p>

              <p className="mt-2 text-sm font-semibold leading-6 text-emerald-700">
                Your account now uses the new password. You will return to the profile overview
                shortly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Security introduction */}
      <section className="relative overflow-hidden rounded-[1.8rem] border border-primary/10 bg-gradient-to-br from-primary-light/80 via-white to-cyan-50 p-5 sm:p-7">
        <div
          aria-hidden="true"
          className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="relative flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy text-cyan-300 shadow-[0_12px_30px_rgba(11,37,69,0.2)]">
            <ShieldCheck className="h-6 w-6" />
          </span>

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-primary">
              Protected update
            </p>

            <h3 className="mt-2 font-heading text-2xl font-black text-navy">
              Create a stronger password
            </h3>

            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-500">
              Confirm your current password, then choose a new password that is difficult for other
              people to guess.
            </p>
          </div>
        </div>
      </section>

      {/* Password fields */}
      <section className="rounded-[1.8rem] border border-primary/10 bg-[#f8fbfe] p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
            <KeyRound className="h-5 w-5" />
          </span>

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">
              Password credentials
            </p>

            <h3 className="mt-2 font-heading text-xl font-black text-navy">
              Enter your secure details
            </h3>
          </div>
        </div>

        <div className="mt-7 space-y-5">
          <PasswordField
            id="current-password"
            label="Current password"
            placeholder="Enter your current password"
            autoComplete="current-password"
            visible={showCurrentPassword}
            disabled={loading}
            error={errors.currentPassword}
            registration={register("currentPassword")}
            onToggleVisibility={() => {
              setShowCurrentPassword((current) => !current);
            }}
          />

          <div className="grid gap-5 lg:grid-cols-2">
            <PasswordField
              id="new-password"
              label="New password"
              placeholder="Create a new password"
              autoComplete="new-password"
              visible={showNewPassword}
              disabled={loading}
              error={errors.newPassword}
              registration={register("newPassword")}
              onToggleVisibility={() => {
                setShowNewPassword((current) => !current);
              }}
            />

            <PasswordField
              id="confirm-new-password"
              label="Confirm new password"
              placeholder="Repeat the new password"
              autoComplete="new-password"
              visible={showConfirmPassword}
              disabled={loading}
              error={errors.confirmNewPassword}
              registration={register("confirmNewPassword")}
              onToggleVisibility={() => {
                setShowConfirmPassword((current) => !current);
              }}
            />
          </div>
        </div>
      </section>

      {/* Password strength */}
      <section className="rounded-[1.8rem] border border-primary/10 bg-white p-5 shadow-[0_14px_35px_rgba(11,37,69,0.06)] sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">
              Password strength
            </p>

            <h3 className="mt-2 font-heading text-xl font-black text-navy">Security checklist</h3>
          </div>

          <div className="rounded-full bg-primary-light px-4 py-2 text-xs font-extrabold text-primary">
            {completedRequirementCount} of {passwordRequirements.length} completed
          </div>
        </div>

        <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              passwordStrength === 100
                ? "bg-emerald-500"
                : passwordStrength >= 60
                  ? "bg-primary"
                  : "bg-amber-400"
            }`}
            style={{
              width: `${passwordStrength}%`,
            }}
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {passwordRequirements.map((requirement) => (
            <div
              key={requirement.label}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                requirement.satisfied
                  ? "border-emerald-100 bg-emerald-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  requirement.satisfied ? "bg-emerald-500 text-white" : "bg-white text-slate-300"
                }`}
              >
                <Check className="h-3.5 w-3.5" />
              </span>

              <span
                className={`text-sm font-bold ${
                  requirement.satisfied ? "text-emerald-700" : "text-slate-500"
                }`}
              >
                {requirement.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <section className="flex flex-col gap-5 rounded-[1.8rem] border border-primary/10 bg-white p-5 shadow-[0_14px_35px_rgba(11,37,69,0.06)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

          <div>
            <p className="font-heading text-lg font-black text-navy">Confirm security update</p>

            <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
              You will use the new password the next time you sign in.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            disabled={loading}
            onClick={handleCancel}
            className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-primary/15 bg-white px-6 text-sm font-extrabold text-slate-600 transition hover:border-primary/35 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading || !isDirty}
            onClick={handleReset}
            className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-primary/15 bg-primary-light px-5 text-sm font-extrabold text-primary transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>

          <button
            type="submit"
            disabled={loading || !isDirty || !isValid || passwordChanged}
            className="inline-flex min-h-[50px] min-w-[205px] items-center justify-center gap-3 rounded-2xl bg-primary px-6 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(30,111,217,0.25)] transition hover:-translate-y-0.5 hover:bg-navy disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            {loading ? (
              <>
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Updating…
              </>
            ) : (
              <>
                <ShieldCheck className="h-5 w-5" />
                Update password
              </>
            )}
          </button>
        </div>
      </section>
    </form>
  );
}

function PasswordField({
  id,
  label,
  placeholder,
  autoComplete,
  visible,
  disabled,
  error,
  registration,
  onToggleVisibility,
}: PasswordFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 flex items-center gap-2 text-sm font-extrabold text-navy">
        <LockKeyhole className="h-4 w-4 text-primary" />

        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          disabled={disabled}
          placeholder={placeholder}
          {...registration}
          className={`min-h-[54px] w-full rounded-2xl border bg-white px-4 pr-14 text-sm font-semibold text-navy outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${
            error
              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
              : "border-primary/15 focus:border-primary focus:ring-primary/10"
          }`}
        />

        <button
          type="button"
          disabled={disabled}
          onClick={onToggleVisibility}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute right-2.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-primary-light hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      {error?.message && (
        <p className="mt-2 flex items-start gap-2 text-xs font-semibold leading-5 text-red-600">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />

          {error.message}
        </p>
      )}
    </div>
  );
}
