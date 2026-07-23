"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from "react";

import {
  BadgeCheck,
  Cake,
  CalendarDays,
  Check,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Edit3,
  FileText,
  Globe2,
  Languages,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import { useProfile } from "@/hooks/useProfile";

import { AvatarUpload } from "@/components/shared/AvatarUpload";
import { EditProfileForm } from "@/components/shared/EditProfileForm";
import { Alert } from "@/components/ui/Alert";

import { ChangePasswordForm } from "./ChangePasswordForm";

import type { PublicUser } from "@/types/user";

type ProfileTab =
  | "overview"
  | "edit"
  | "security";

interface ProfileTabItem {
  id: ProfileTab;
  label: string;
  description: string;

  icon: ComponentType<{
    className?: string;
  }>;
}

const PROFILE_TABS: ProfileTabItem[] = [
  {
    id: "overview",
    label: "Overview",
    description: "Account summary",
    icon: CircleUserRound,
  },
  {
    id: "edit",
    label: "Personal details",
    description: "Update your information",
    icon: Edit3,
  },
  {
    id: "security",
    label: "Security",
    description: "Password protection",
    icon: LockKeyhole,
  },
];

const GENDER_LABELS: Record<
  string,
  string
> = {
  male: "Male",
  female: "Female",
  prefer_not_to_say:
    "Prefer not to say",
};

const LANGUAGE_LABELS: Record<
  string,
  string
> = {
  en: "English",
  ar: "Arabic",
  fr: "French",
};

function formatDateOnly(
  value: string | null,
): string {
  if (!value) {
    return "Not provided";
  }

  const dateValue =
    value.slice(0, 10);

  const [year, month, day] =
    dateValue
      .split("-")
      .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return value;
  }

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      12,
    ),
  );

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    },
  ).format(date);
}

function formatMemberSince(
  value: string,
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "CleanNest member";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "long",
      year: "numeric",
    },
  ).format(date);
}

function formatLastUpdated(
  value: string,
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Recently";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  ).format(date);
}

function humanizeValue(
  value: string,
): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function calculateProfileCompletion(
  user: PublicUser,
): {
  percentage: number;
  completed: number;
  total: number;
  missingItems: string[];
} {
  const fields = [
    {
      complete:
        Boolean(
          user.name.trim(),
        ),

      label: "Full name",
    },
    {
      complete:
        Boolean(
          user.email.trim(),
        ),

      label: "Email address",
    },
    {
      complete:
        Boolean(user.phone),

      label: "Phone number",
    },
    {
      complete:
        Boolean(
          user.avatarUrl,
        ),

      label: "Profile photo",
    },
    {
      complete:
        Boolean(
          user.dateOfBirth,
        ),

      label: "Date of birth",
    },
    {
      complete:
        Boolean(user.gender),

      label: "Gender",
    },
    {
      complete:
        Boolean(user.bio),

      label: "Personal bio",
    },
    {
      complete:
        Boolean(
          user.preferredLanguage,
        ),

      label:
        "Preferred language",
    },
  ];

  const completed =
    fields.filter(
      (field) =>
        field.complete,
    ).length;

  const missingItems =
    fields
      .filter(
        (field) =>
          !field.complete,
      )
      .map(
        (field) =>
          field.label,
      );

  return {
    completed,
    total: fields.length,

    percentage:
      Math.round(
        (completed /
          fields.length) *
          100,
      ),

    missingItems,
  };
}

export function ProfileView() {
  const {
    user,
    loading,
    error,
    fetchProfile,
  } = useProfile();

  const [
    displayUser,
    setDisplayUser,
  ] = useState<
    PublicUser | null
  >(null);

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<ProfileTab>(
      "overview",
    );

  useEffect(() => {
    void fetchProfile();

    // fetchProfile is stable through useCallback.
  }, [fetchProfile]);

  useEffect(() => {
    if (user) {
      setDisplayUser(user);
    }
  }, [user]);

  const profileCompletion =
    useMemo(() => {
      if (!displayUser) {
        return {
          percentage: 0,
          completed: 0,
          total: 0,
          missingItems: [],
        };
      }

      return calculateProfileCompletion(
        displayUser,
      );
    }, [displayUser]);

  if (
    loading &&
    !displayUser
  ) {
    return (
      <ProfileLoadingState />
    );
  }

  if (!displayUser) {
    return (
      <div className="relative min-h-[70vh] overflow-hidden rounded-[2rem] bg-[#f4f8fc] p-5 sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(30,111,217,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.05) 1px, transparent 1px)",

            backgroundSize:
              "42px 42px",
          }}
        />

        <div className="relative mx-auto flex min-h-[55vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-[2rem] border border-white bg-white/90 p-7 text-center shadow-[0_25px_70px_rgba(11,37,69,0.12)] backdrop-blur-xl sm:p-10">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.7rem] bg-red-50 text-red-500">
              <CircleUserRound className="h-9 w-9" />
            </span>

            <h1 className="mt-6 font-heading text-3xl font-black text-navy">
              Profile unavailable
            </h1>

            <p className="mx-auto mt-4 max-w-md text-base font-medium leading-7 text-slate-500">
              CleanNest could not load
              your account information.
            </p>

            {error && (
              <div className="mt-6 text-left">
                <Alert variant="error">
                  {error}
                </Alert>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                void fetchProfile();
              }}
              className="mt-7 inline-flex min-h-[50px] items-center justify-center gap-3 rounded-2xl bg-primary px-6 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(30,111,217,0.25)] transition hover:-translate-y-0.5 hover:bg-navy"
            >
              <RefreshCw className="h-4 w-4" />

              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const status =
    String(
      displayUser.status,
    ).toLowerCase();

  const isActive =
    status === "active";

  const memberSince =
    formatMemberSince(
      displayUser.createdAt,
    );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f7fc] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Background pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.38]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(30,111,217,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.05) 1px, transparent 1px)",

          backgroundSize:
            "48px 48px",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-40 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-48 top-0 h-[32rem] w-[32rem] rounded-full bg-cyan-300/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1450px]">
        {/* Page heading */}
        <header className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy text-cyan-300 shadow-[0_12px_30px_rgba(11,37,69,0.2)]">
                <Sparkles className="h-5 w-5" />
              </span>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">
                  Personal home hub
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-400">
                  CleanNest account center
                </p>
              </div>
            </div>

            <h1 className="mt-5 font-heading text-4xl font-black tracking-[-0.045em] text-navy sm:text-5xl">
              Your space. Your profile.
            </h1>

            <p className="mt-4 max-w-2xl text-base font-medium leading-8 text-slate-500">
              Manage the information
              that helps CleanNest
              deliver a more personal,
              secure, and reliable
              cleaning experience.
            </p>
          </div>

          <div className="flex w-fit items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />

            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-emerald-600">
                Account protection
              </p>

              <p className="mt-1 text-sm font-extrabold text-emerald-800">
                Secure profile access
              </p>
            </div>
          </div>
        </header>

        {/* Premium profile hero */}
        <section className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-navy text-white shadow-[0_35px_100px_rgba(11,37,69,0.24)]">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(34,211,238,0.22),transparent_31%),radial-gradient(circle_at_10%_100%,rgba(30,111,217,0.38),transparent_36%)]"
          />

          <div
            aria-hidden="true"
            className="absolute -right-14 -top-14 h-56 w-56 rounded-full border border-white/10"
          />

          <div
            aria-hidden="true"
            className="absolute -right-4 -top-4 h-36 w-36 rounded-full border border-white/10"
          />

          <div className="relative grid gap-8 px-5 py-7 sm:px-8 sm:py-9 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center lg:px-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="shrink-0 rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur-md">
                <AvatarUpload
                  user={displayUser}
                  onUploaded={(
                    updatedUser,
                  ) => {
                    setDisplayUser(
                      updatedUser,
                    );
                  }}
                />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.13em] text-cyan-200">
                    <BadgeCheck className="h-4 w-4" />

                    Verified account
                  </span>

                  <span
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.13em] ${
                      isActive
                        ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                        : "border-amber-300/20 bg-amber-300/10 text-amber-200"
                    }`}
                  >
                    {humanizeValue(
                      String(
                        displayUser.status,
                      ),
                    )}
                  </span>
                </div>

                <h2 className="mt-5 truncate font-heading text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                  {displayUser.name}
                </h2>

                <div className="mt-4 flex flex-col gap-2 text-sm font-semibold text-blue-100/70 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-cyan-300" />

                    {displayUser.email}
                  </span>

                  {displayUser.phone && (
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-cyan-300" />

                      {
                        displayUser.phone
                      }
                    </span>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="rounded-xl bg-white/10 px-4 py-2 text-xs font-extrabold capitalize text-white">
                    {displayUser.role}
                  </span>

                  <span className="flex items-center gap-2 text-xs font-semibold text-blue-100/60">
                    <CalendarDays className="h-4 w-4" />

                    Member since{" "}
                    {memberSince}
                  </span>
                </div>
              </div>
            </div>

            {/* Completion panel */}
            <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.08] p-5 backdrop-blur-xl sm:p-6">
              <div className="flex items-center gap-5">
                <div
                  className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(#22d3ee ${profileCompletion.percentage}%, rgba(255,255,255,0.12) 0)`,
                  }}
                >
                  <div className="flex h-[76px] w-[76px] flex-col items-center justify-center rounded-full bg-navy">
                    <span className="font-heading text-2xl font-black">
                      {
                        profileCompletion.percentage
                      }
                      %
                    </span>

                    <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-cyan-300">
                      Complete
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-cyan-300">
                    Profile strength
                  </p>

                  <p className="mt-2 font-heading text-xl font-black">
                    {profileCompletion.percentage ===
                    100
                      ? "Profile perfected"
                      : "Almost there"}
                  </p>

                  <p className="mt-2 text-sm font-medium leading-6 text-blue-100/65">
                    {
                      profileCompletion.completed
                    }{" "}
                    of{" "}
                    {
                      profileCompletion.total
                    }{" "}
                    details completed
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("edit");
                }}
                className="mt-6 flex min-h-[50px] w-full items-center justify-between rounded-2xl bg-white px-5 text-sm font-extrabold text-navy transition hover:-translate-y-0.5 hover:bg-cyan-50"
              >
                Complete your profile

                <ChevronRight className="h-5 w-5 text-primary" />
              </button>
            </div>
          </div>
        </section>

        {/* Profile navigation */}
        <section className="mt-7 overflow-x-auto rounded-[1.7rem] border border-white bg-white/85 p-2 shadow-[0_16px_45px_rgba(11,37,69,0.08)] backdrop-blur-xl">
          <div className="flex min-w-[650px] gap-2">
            {PROFILE_TABS.map(
              (tab) => {
                const Icon =
                  tab.icon;

                const isSelected =
                  activeTab ===
                  tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(
                        tab.id,
                      );
                    }}
                    className={`flex min-h-[72px] flex-1 items-center gap-4 rounded-[1.3rem] px-5 text-left transition ${
                      isSelected
                        ? "bg-navy text-white shadow-[0_14px_30px_rgba(11,37,69,0.18)]"
                        : "text-slate-500 hover:bg-primary-light/60 hover:text-navy"
                    }`}
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        isSelected
                          ? "bg-white/10 text-cyan-300"
                          : "bg-primary-light text-primary"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>

                    <span>
                      <span className="block text-sm font-extrabold">
                        {tab.label}
                      </span>

                      <span
                        className={`mt-1 block text-xs font-semibold ${
                          isSelected
                            ? "text-blue-100/60"
                            : "text-slate-400"
                        }`}
                      >
                        {
                          tab.description
                        }
                      </span>
                    </span>
                  </button>
                );
              },
            )}
          </div>
        </section>

        {/* Overview */}
        {activeTab ===
          "overview" && (
          <div className="mt-7 grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_370px]">
            <div className="space-y-7">
              {/* Personal information */}
              <section className="rounded-[2rem] border border-white bg-white/90 p-5 shadow-[0_22px_65px_rgba(11,37,69,0.09)] backdrop-blur-xl sm:p-7">
                <SectionHeading
                  icon={UserRound}
                  eyebrow="Personal identity"
                  title="Your profile information"
                  description="The information connected to your CleanNest account."
                  action={
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab(
                          "edit",
                        );
                      }}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/15 bg-primary-light px-4 text-sm font-extrabold text-primary transition hover:bg-primary hover:text-white"
                    >
                      <Edit3 className="h-4 w-4" />

                      Edit
                    </button>
                  }
                />

                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <InformationCard
                    icon={UserRound}
                    label="Full name"
                    value={
                      displayUser.name
                    }
                  />

                  <InformationCard
                    icon={Mail}
                    label="Email address"
                    value={
                      displayUser.email
                    }
                    verified
                  />

                  <InformationCard
                    icon={Phone}
                    label="Phone number"
                    value={
                      displayUser.phone ??
                      "Not provided"
                    }
                    muted={
                      !displayUser.phone
                    }
                  />

                  <InformationCard
                    icon={Cake}
                    label="Date of birth"
                    value={formatDateOnly(
                      displayUser.dateOfBirth,
                    )}
                    muted={
                      !displayUser.dateOfBirth
                    }
                  />

                  <InformationCard
                    icon={
                      CircleUserRound
                    }
                    label="Gender"
                    value={
                      displayUser.gender
                        ? GENDER_LABELS[
                            displayUser.gender
                          ] ??
                          humanizeValue(
                            displayUser.gender,
                          )
                        : "Not provided"
                    }
                    muted={
                      !displayUser.gender
                    }
                  />

                  <InformationCard
                    icon={Languages}
                    label="Preferred language"
                    value={
                      LANGUAGE_LABELS[
                        displayUser
                          .preferredLanguage
                      ] ??
                      humanizeValue(
                        displayUser
                          .preferredLanguage,
                      )
                    }
                  />
                </div>
              </section>

              {/* Bio */}
              <section className="rounded-[2rem] border border-white bg-white/90 p-5 shadow-[0_22px_65px_rgba(11,37,69,0.09)] backdrop-blur-xl sm:p-7">
                <SectionHeading
                  icon={FileText}
                  eyebrow="Personal introduction"
                  title="About you"
                  description="A short personal note stored with your account."
                />

                <div className="relative mt-7 overflow-hidden rounded-[1.6rem] border border-primary/10 bg-[#f4f8fc] p-6">
                  <div
                    aria-hidden="true"
                    className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl"
                  />

                  <div className="relative">
                    {displayUser.bio ? (
                      <p className="max-w-3xl text-base font-medium leading-8 text-slate-600">
                        “{displayUser.bio}”
                      </p>
                    ) : (
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-heading text-xl font-black text-navy">
                            Your story is
                            still empty.
                          </p>

                          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                            Add a short
                            introduction to
                            make your
                            profile feel
                            more personal.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab(
                              "edit",
                            );
                          }}
                          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-extrabold text-white transition hover:bg-navy"
                        >
                          Add bio

                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* Right column */}
            <aside className="space-y-7 xl:sticky xl:top-6">
              {/* Profile completion */}
              <section className="overflow-hidden rounded-[2rem] border border-white bg-white/90 shadow-[0_22px_65px_rgba(11,37,69,0.09)] backdrop-blur-xl">
                <div className="bg-navy p-6 text-white">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-cyan-300">
                        Profile checklist
                      </p>

                      <h3 className="mt-2 font-heading text-2xl font-black">
                        Build trust
                      </h3>
                    </div>

                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-300">
                      <Check className="h-6 w-6" />
                    </span>
                  </div>

                  <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary via-cyan-300 to-emerald-300 transition-all duration-700"
                      style={{
                        width: `${profileCompletion.percentage}%`,
                      }}
                    />
                  </div>

                  <p className="mt-3 text-xs font-semibold text-blue-100/65">
                    {
                      profileCompletion.percentage
                    }
                    % complete
                  </p>
                </div>

                <div className="p-6">
                  {profileCompletion
                    .missingItems
                    .length === 0 ? (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-center">
                      <BadgeCheck className="mx-auto h-8 w-8 text-emerald-600" />

                      <p className="mt-3 font-extrabold text-emerald-800">
                        Everything looks
                        perfect
                      </p>

                      <p className="mt-2 text-sm font-medium leading-6 text-emerald-700">
                        Your profile is
                        fully completed.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-semibold leading-6 text-slate-500">
                        Complete these
                        details to reach
                        100%:
                      </p>

                      <div className="mt-5 space-y-3">
                        {profileCompletion.missingItems.map(
                          (item) => (
                            <div
                              key={item}
                              className="flex items-center gap-3 rounded-xl bg-surface-soft px-4 py-3"
                            >
                              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />

                              <span className="text-sm font-bold text-slate-600">
                                {item}
                              </span>
                            </div>
                          ),
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab(
                            "edit",
                          );
                        }}
                        className="mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-extrabold text-white transition hover:bg-navy"
                      >
                        Complete profile

                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </section>

              {/* Account information */}
              <section className="rounded-[2rem] border border-white bg-white/90 p-6 shadow-[0_22px_65px_rgba(11,37,69,0.09)] backdrop-blur-xl">
                <SectionHeading
                  icon={Clock3}
                  eyebrow="Account record"
                  title="Account details"
                />

                <div className="mt-6 space-y-5">
                  <AccountDetail
                    label="Member since"
                    value={memberSince}
                  />

                  <AccountDetail
                    label="Last updated"
                    value={formatLastUpdated(
                      displayUser.updatedAt,
                    )}
                  />

                  <AccountDetail
                    label="Account type"
                    value={humanizeValue(
                      String(
                        displayUser.role,
                      ),
                    )}
                  />

                  <AccountDetail
                    label="Account status"
                    value={humanizeValue(
                      String(
                        displayUser.status,
                      ),
                    )}
                    positive={
                      isActive
                    }
                  />
                </div>
              </section>

              {/* Security shortcut */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab(
                    "security",
                  );
                }}
                className="group w-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-navy p-6 text-left text-white shadow-[0_22px_65px_rgba(30,111,217,0.24)] transition hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-5">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-300">
                    <LockKeyhole className="h-5 w-5" />
                  </span>

                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </div>

                <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.17em] text-cyan-300">
                  Account security
                </p>

                <p className="mt-2 font-heading text-2xl font-black">
                  Protect your account
                </p>

                <p className="mt-3 text-sm font-medium leading-6 text-blue-100/70">
                  Update your password
                  and keep your CleanNest
                  account secure.
                </p>
              </button>
            </aside>
          </div>
        )}

        {/* Edit details */}
        {activeTab === "edit" && (
          <section className="mt-7 grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_350px]">
            <div className="rounded-[2rem] border border-white bg-white/90 p-5 shadow-[0_25px_75px_rgba(11,37,69,0.1)] backdrop-blur-xl sm:p-8">
              <SectionHeading
                icon={Edit3}
                eyebrow="Profile editor"
                title="Update your personal details"
                description="Keep your information accurate so CleanNest can communicate with you effectively."
              />

              <div className="mt-8">
                <EditProfileForm
                  user={displayUser}
                  onSaved={(
                    updatedUser,
                  ) => {
                    setDisplayUser(
                      updatedUser,
                    );

                    setActiveTab(
                      "overview",
                    );
                  }}
                />
              </div>
            </div>

            <aside className="space-y-6 xl:sticky xl:top-6">
              <div className="rounded-[2rem] bg-navy p-6 text-white shadow-[0_22px_65px_rgba(11,37,69,0.2)]">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-300">
                  <ShieldCheck className="h-5 w-5" />
                </span>

                <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.17em] text-cyan-300">
                  Privacy first
                </p>

                <h3 className="mt-2 font-heading text-2xl font-black">
                  Your information stays protected
                </h3>

                <p className="mt-4 text-sm font-medium leading-7 text-blue-100/70">
                  Your profile details
                  are used only for your
                  account and CleanNest
                  service communication.
                </p>
              </div>

              <div className="rounded-[2rem] border border-primary/10 bg-primary-light/50 p-6">
                <Globe2 className="h-7 w-7 text-primary" />

                <h3 className="mt-4 font-heading text-xl font-black text-navy">
                  Language preference
                </h3>

                <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
                  Your selected language
                  can be used for future
                  notifications and
                  personalized content.
                </p>
              </div>
            </aside>
          </section>
        )}

        {/* Security */}
        {activeTab ===
          "security" && (
          <section className="mt-7 grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-[2rem] border border-white bg-white/90 p-5 shadow-[0_25px_75px_rgba(11,37,69,0.1)] backdrop-blur-xl sm:p-8">
              <SectionHeading
                icon={LockKeyhole}
                eyebrow="Password security"
                title="Change your password"
                description="Use a strong, unique password that you do not use for another account."
              />

              <div className="mt-8">
                <ChangePasswordForm
                  onDone={() => {
                    setActiveTab(
                      "overview",
                    );
                  }}
                />
              </div>
            </div>

            <aside className="space-y-6 xl:sticky xl:top-6">
              <div className="overflow-hidden rounded-[2rem] bg-navy text-white shadow-[0_22px_65px_rgba(11,37,69,0.2)]">
                <div className="p-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-300">
                    <ShieldCheck className="h-6 w-6" />
                  </span>

                  <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.17em] text-cyan-300">
                    Security guide
                  </p>

                  <h3 className="mt-2 font-heading text-2xl font-black">
                    A strong password protects your home
                  </h3>
                </div>

                <div className="border-t border-white/10 bg-white/[0.04] p-6">
                  <SecurityTip text="Use at least eight characters." />

                  <SecurityTip text="Combine letters, numbers, and symbols." />

                  <SecurityTip text="Avoid names and easy-to-guess dates." />

                  <SecurityTip text="Never share your password with anyone." />
                </div>
              </div>

              <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-6">
                <BadgeCheck className="h-7 w-7 text-emerald-600" />

                <h3 className="mt-4 font-heading text-xl font-black text-emerald-900">
                  Account verified
                </h3>

                <p className="mt-3 text-sm font-medium leading-6 text-emerald-700">
                  Your account is linked
                  to{" "}
                  <span className="font-extrabold">
                    {
                      displayUser.email
                    }
                  </span>
                  .
                </p>
              </div>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}

interface SectionHeadingProps {
  icon: ComponentType<{
    className?: string;
  }>;

  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

function SectionHeading({
  icon: Icon,
  eyebrow,
  title,
  description,
  action,
}: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary">
          <Icon className="h-5 w-5" />
        </span>

        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-primary">
            {eyebrow}
          </p>

          <h2 className="mt-2 font-heading text-2xl font-black tracking-[-0.03em] text-navy sm:text-3xl">
            {title}
          </h2>

          {description && (
            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-500">
              {description}
            </p>
          )}
        </div>
      </div>

      {action}
    </div>
  );
}

interface InformationCardProps {
  icon: ComponentType<{
    className?: string;
  }>;

  label: string;
  value: string;

  muted?: boolean;
  verified?: boolean;
}

function InformationCard({
  icon: Icon,
  label,
  value,
  muted = false,
  verified = false,
}: InformationCardProps) {
  return (
    <div className="group rounded-[1.4rem] border border-primary/10 bg-[#f7fafc] p-5 transition hover:-translate-y-0.5 hover:border-primary/25 hover:bg-white hover:shadow-[0_14px_30px_rgba(11,37,69,0.07)]">
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
          <Icon className="h-4 w-4" />
        </span>

        {verified && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-emerald-600">
            <BadgeCheck className="h-3.5 w-3.5" />

            Verified
          </span>
        )}
      </div>

      <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.13em] text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 break-words text-sm font-extrabold leading-6 ${
          muted
            ? "text-slate-400"
            : "text-navy"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

interface AccountDetailProps {
  label: string;
  value: string;
  positive?: boolean;
}

function AccountDetail({
  label,
  value,
  positive = false,
}: AccountDetailProps) {
  return (
    <div className="flex items-center justify-between gap-5 border-b border-primary/10 pb-4 last:border-b-0 last:pb-0">
      <span className="text-sm font-semibold text-slate-500">
        {label}
      </span>

      <span
        className={`text-right text-sm font-extrabold ${
          positive
            ? "text-emerald-600"
            : "text-navy"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function SecurityTip({
  text,
}: {
  text: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3 last:mb-0">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-navy">
        <Check className="h-3 w-3" />
      </span>

      <p className="text-sm font-medium leading-6 text-blue-100/75">
        {text}
      </p>
    </div>
  );
}

function ProfileLoadingState() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f3f7fc] p-5 sm:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(30,111,217,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.05) 1px, transparent 1px)",

          backgroundSize:
            "48px 48px",
        }}
      />

      <div className="relative mx-auto flex min-h-[75vh] max-w-2xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-white bg-white/90 p-8 text-center shadow-[0_25px_75px_rgba(11,37,69,0.12)] backdrop-blur-xl">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.7rem] bg-navy text-cyan-300">
            <LoaderCircle className="h-9 w-9 animate-spin" />
          </span>

          <h1 className="mt-6 font-heading text-3xl font-black text-navy">
            Preparing your profile
          </h1>

          <p className="mt-4 text-base font-medium text-slate-500">
            Loading your personal
            CleanNest account experience.
          </p>

          <div className="mx-auto mt-7 h-2 max-w-sm overflow-hidden rounded-full bg-primary-light">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}