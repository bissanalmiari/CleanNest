"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

import {
  AlertCircle,
  BadgeCheck,
  Cake,
  CheckCircle2,
  FileText,
  Languages,
  LoaderCircle,
  Mail,
  Phone,
  Save,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  useForm,
  type FieldError,
} from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  updateProfileSchema,
  type UpdateProfileValues,
} from "@/validators/userValidator";

import { useProfile } from "@/hooks/useProfile";

import type { PublicUser } from "@/types/user";

interface EditProfileFormProps {
  user: PublicUser;

  onSaved: (
    updatedUser: PublicUser,
  ) => void;
}

interface FormFieldShellProps {
  icon: ComponentType<{
    className?: string;
  }>;

  label: string;
  htmlFor: string;
  optional?: boolean;
  error?: FieldError;
  children: ReactNode;
}

function dateInputValue(
  value: string | null,
): string {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

function createDefaultValues(
  user: PublicUser,
): UpdateProfileValues {
  return {
    name: user.name,

    phone:
      user.phone ?? "",

    dateOfBirth:
      dateInputValue(
        user.dateOfBirth,
      ),

    /*
     * Do not use "prefer_not_to_say" here unless
     * that exact value exists in the Gender type.
     * An undefined value represents no selection.
     */
    gender:
      user.gender ??
      undefined,

    preferredLanguage:
      user.preferredLanguage,

    bio:
      user.bio ?? "",
  };
}

export function EditProfileForm({
  user,
  onSaved,
}: EditProfileFormProps) {
  const {
    updateProfile,
    loading,
    error,
    setError,
  } = useProfile();

  const successTimerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  const [
    savedSuccessfully,
    setSavedSuccessfully,
  ] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,

    formState: {
      errors,
      isDirty,
      isValid,
    },
  } = useForm<UpdateProfileValues>({
    resolver:
      zodResolver(
        updateProfileSchema,
      ),

    mode: "onChange",

    defaultValues:
      createDefaultValues(
        user,
      ),
  });

  const watchedBio =
    watch("bio");

  const bioValue =
    typeof watchedBio ===
    "string"
      ? watchedBio
      : "";

  useEffect(() => {
    reset(
      createDefaultValues(
        user,
      ),
    );
  }, [
    reset,
    user,
  ]);

  useEffect(() => {
    return () => {
      if (
        successTimerRef.current
      ) {
        clearTimeout(
          successTimerRef.current,
        );
      }
    };
  }, []);

  function clearSuccessTimer() {
    if (
      successTimerRef.current
    ) {
      clearTimeout(
        successTimerRef.current,
      );

      successTimerRef.current =
        null;
    }
  }

  async function onSubmit(
    values: UpdateProfileValues,
  ) {
    setError(null);

    setSavedSuccessfully(
      false,
    );

    clearSuccessTimer();

    const updatedUser =
      await updateProfile(
        values,
      );

    if (!updatedUser) {
      return;
    }

    reset(
      createDefaultValues(
        updatedUser,
      ),
    );

    setSavedSuccessfully(
      true,
    );

    onSaved(updatedUser);

    successTimerRef.current =
      setTimeout(() => {
        setSavedSuccessfully(
          false,
        );

        successTimerRef.current =
          null;
      }, 3000);
  }

  function handleReset() {
    setError(null);

    setSavedSuccessfully(
      false,
    );

    clearSuccessTimer();

    reset(
      createDefaultValues(
        user,
      ),
    );
  }

  return (
    <form
      onSubmit={handleSubmit(
        onSubmit,
      )}
      className="space-y-7"
      noValidate
    >
      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-extrabold">
              Profile could not be
              updated
            </p>

            <p className="mt-1 text-sm font-semibold leading-6">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Success message */}
      {savedSuccessfully && (
        <div
          aria-live="polite"
          className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-extrabold">
              Profile updated
            </p>

            <p className="mt-1 text-sm font-semibold leading-6">
              Your personal information
              was saved successfully.
            </p>
          </div>
        </div>
      )}

      {/* Basic identity */}
      <section className="rounded-[1.7rem] border border-primary/10 bg-[#f8fbfe] p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
            <UserRound className="h-5 w-5" />
          </span>

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">
              Basic identity
            </p>

            <h3 className="mt-2 font-heading text-xl font-black text-navy">
              Name and contact details
            </h3>

            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              Keep your contact
              information accurate for
              booking updates and
              service communication.
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-2">
          <FormFieldShell
            icon={UserRound}
            label="Full name"
            htmlFor="profile-name"
            error={errors.name}
          >
            <input
              id="profile-name"
              type="text"
              autoComplete="name"
              disabled={loading}
              placeholder="Enter your full name"
              {...register("name")}
              className={fieldClass(
                Boolean(
                  errors.name,
                ),
              )}
            />
          </FormFieldShell>

          <FormFieldShell
            icon={Phone}
            label="Phone number"
            htmlFor="profile-phone"
            optional
            error={errors.phone}
          >
            <input
              id="profile-phone"
              type="tel"
              autoComplete="tel"
              disabled={loading}
              placeholder="+961 00 000 000"
              {...register("phone")}
              className={fieldClass(
                Boolean(
                  errors.phone,
                ),
              )}
            />
          </FormFieldShell>

          <div className="lg:col-span-2">
            <FormFieldShell
              icon={Mail}
              label="Email address"
              htmlFor="profile-email"
            >
              <div className="relative">
                <input
                  id="profile-email"
                  type="email"
                  value={user.email}
                  disabled
                  readOnly
                  className="min-h-[54px] w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 px-4 pr-36 text-sm font-semibold text-slate-500 outline-none"
                />

                <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-emerald-600">
                  <BadgeCheck className="h-3.5 w-3.5" />

                  Verified
                </span>
              </div>

              <p className="mt-2 text-xs font-medium leading-5 text-slate-400">
                Email changes require a
                separate verification
                process.
              </p>
            </FormFieldShell>
          </div>
        </div>
      </section>

      {/* Personal details */}
      <section className="rounded-[1.7rem] border border-primary/10 bg-[#f8fbfe] p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
            <UsersRound className="h-5 w-5" />
          </span>

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">
              Personal details
            </p>

            <h3 className="mt-2 font-heading text-xl font-black text-navy">
              A profile shaped around
              you
            </h3>

            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              These optional details
              help personalize your
              CleanNest account
              experience.
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-2">
          <FormFieldShell
            icon={Cake}
            label="Date of birth"
            htmlFor="profile-date-of-birth"
            optional
            error={
              errors.dateOfBirth
            }
          >
            <input
              id="profile-date-of-birth"
              type="date"
              disabled={loading}
              {...register(
                "dateOfBirth",
              )}
              className={fieldClass(
                Boolean(
                  errors.dateOfBirth,
                ),
              )}
            />
          </FormFieldShell>

          <FormFieldShell
            icon={UsersRound}
            label="Gender"
            htmlFor="profile-gender"
            optional
            error={errors.gender}
          >
            <select
              id="profile-gender"
              disabled={loading}
              {...register(
                "gender",
                {
                  setValueAs: (
                    value: string,
                  ) =>
                    value === ""
                      ? undefined
                      : value,
                },
              )}
              className={fieldClass(
                Boolean(
                  errors.gender,
                ),
              )}
            >
              <option value="">
                Prefer not to say
              </option>

              <option value="male">
                Male
              </option>

              <option value="female">
                Female
              </option>
            </select>
          </FormFieldShell>

          <div className="lg:col-span-2">
            <FormFieldShell
              icon={Languages}
              label="Preferred language"
              htmlFor="profile-language"
              error={
                errors.preferredLanguage
              }
            >
              <select
                id="profile-language"
                disabled={loading}
                {...register(
                  "preferredLanguage",
                )}
                className={fieldClass(
                  Boolean(
                    errors.preferredLanguage,
                  ),
                )}
              >
                <option value="en">
                  English
                </option>

                <option value="ar">
                  Arabic
                </option>

                <option value="fr">
                  French
                </option>
              </select>
            </FormFieldShell>
          </div>
        </div>
      </section>

      {/* Biography */}
      <section className="rounded-[1.7rem] border border-primary/10 bg-[#f8fbfe] p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
            <FileText className="h-5 w-5" />
          </span>

          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">
              Personal introduction
            </p>

            <h3 className="mt-2 font-heading text-xl font-black text-navy">
              Tell us a little about you
            </h3>
          </div>
        </div>

        <div className="mt-7">
          <FormFieldShell
            icon={FileText}
            label="Profile bio"
            htmlFor="profile-bio"
            optional
            error={errors.bio}
          >
            <textarea
              id="profile-bio"
              rows={6}
              maxLength={300}
              disabled={loading}
              placeholder="A short note about yourself..."
              {...register("bio")}
              className={`${fieldClass(
                Boolean(
                  errors.bio,
                ),
              )} resize-none py-4 leading-7`}
            />

            <div className="mt-2 flex items-center justify-between gap-4">
              <p className="text-xs font-medium text-slate-400">
                Add up to 300
                characters.
              </p>

              <p
                className={`text-xs font-extrabold ${
                  bioValue.length >
                  270
                    ? "text-amber-500"
                    : "text-slate-400"
                }`}
              >
                {bioValue.length}/300
              </p>
            </div>
          </FormFieldShell>
        </div>
      </section>

      {/* Form actions */}
      <section className="flex flex-col gap-4 rounded-[1.7rem] border border-primary/10 bg-white p-5 shadow-[0_14px_35px_rgba(11,37,69,0.06)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="font-heading text-lg font-black text-navy">
            Save your profile
          </p>

          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
            Changes are applied to your
            CleanNest account
            immediately.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            disabled={
              loading ||
              !isDirty
            }
            onClick={handleReset}
            className="inline-flex min-h-[50px] items-center justify-center rounded-2xl border border-primary/15 bg-white px-6 text-sm font-extrabold text-slate-600 transition hover:border-primary/35 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reset changes
          </button>

          <button
            type="submit"
            disabled={
              loading ||
              !isDirty ||
              !isValid
            }
            className="inline-flex min-h-[50px] min-w-[180px] items-center justify-center gap-3 rounded-2xl bg-primary px-6 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(30,111,217,0.25)] transition hover:-translate-y-0.5 hover:bg-navy disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            {loading ? (
              <>
                <LoaderCircle className="h-5 w-5 animate-spin" />

                Saving…
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />

                Save changes
              </>
            )}
          </button>
        </div>
      </section>
    </form>
  );
}

function fieldClass(
  hasError: boolean,
): string {
  return [
    "min-h-[54px] w-full rounded-2xl border bg-white px-4 text-sm font-semibold text-navy outline-none transition",
    "placeholder:text-slate-400",
    "focus:ring-4",
    "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-70",

    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-primary/15 focus:border-primary focus:ring-primary/10",
  ].join(" ");
}

function FormFieldShell({
  icon: Icon,
  label,
  htmlFor,
  optional = false,
  error,
  children,
}: FormFieldShellProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <label
          htmlFor={htmlFor}
          className="flex items-center gap-2 text-sm font-extrabold text-navy"
        >
          <Icon className="h-4 w-4 text-primary" />

          {label}
        </label>

        {optional && (
          <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
            Optional
          </span>
        )}
      </div>

      {children}

      {error?.message && (
        <p className="mt-2 flex items-start gap-2 text-xs font-semibold leading-5 text-red-600">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />

          {error.message}
        </p>
      )}
    </div>
  );
}