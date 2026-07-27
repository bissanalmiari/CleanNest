"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Mail,
  Phone,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserRoundCog,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { AccountStatusBadge, RoleBadge } from "@/components/users/UserBadges";

type UserRole = "customer" | "cleaner" | "admin";

interface UserDetail {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

interface UserDetailData {
  user: UserDetail;
  bookingCount: number;
  assignmentCount: number;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatDate(value?: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Beirut",
  }).format(date);
}

function roleContext(role: UserRole) {
  if (role === "customer") {
    return {
      label: "Customer bookings",
      description: "Bookings created by this customer account",
      href: "/admin/bookings",
    };
  }
  if (role === "cleaner") {
    return {
      label: "Cleaner assignments",
      description: "Booking assignments linked to this cleaner",
      href: "/admin/bookings",
    };
  }
  return {
    label: "Administrator access",
    description: "Privileged CleanNest management identity",
    href: "/admin/admin-users",
  };
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const userId = params.id;
  const [data, setData] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDetail = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);

      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          cache: "no-store",
        });
        const json: ApiEnvelope<UserDetailData> = await response.json();

        if (!response.ok || !json.success || !json.data) {
          throw new Error(json.error ?? "Identity profile could not be loaded.");
        }

        setData(json.data);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Identity profile could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  async function toggleAccess() {
    if (!data) return;
    const action = data.user.status === "suspended" ? "unblock" : "block";
    if (
      !window.confirm(
        action === "block"
          ? `Suspend ${data.user.name}? They will no longer be able to sign in.`
          : `Restore platform access for ${data.user.name}?`
      )
    ) {
      return;
    }

    setWorking(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/block`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json: ApiEnvelope<unknown> = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error ?? "Account status could not be changed.");
      }
      await fetchDetail(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "The action failed.");
    } finally {
      setWorking(false);
    }
  }

  async function deleteUser() {
    if (!data) return;
    if (!window.confirm(`Permanently delete ${data.user.name}? This action cannot be undone.`)) {
      return;
    }

    setWorking(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      const json: ApiEnvelope<unknown> = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error ?? "Identity could not be deleted.");
      }
      router.replace("/admin/admin-users");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "The action failed.");
      setWorking(false);
    }
  }

  if (loading) return <DetailSkeleton />;

  if (errorMessage || !data) {
    return (
      <main className="min-h-screen bg-[#f3f7fc] px-4 py-12 sm:px-6">
        <div className="mx-auto flex min-h-[520px] max-w-3xl flex-col items-center justify-center rounded-[2rem] border border-red-100 bg-white p-8 text-center shadow-[0_20px_60px_rgba(11,37,69,0.08)]">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle className="h-7 w-7" />
          </span>
          <h1 className="mt-5 font-heading text-2xl font-black text-navy">Identity unavailable</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            {errorMessage ?? "This platform identity could not be found."}
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/admin/admin-users"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-extrabold text-navy"
            >
              <ArrowLeft className="h-4 w-4" />
              Account directory
            </Link>
            <button
              type="button"
              onClick={() => void fetchDetail()}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-navy px-4 text-xs font-extrabold text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  const user = data.user;
  const context = roleContext(user.role);
  const activityValue =
    user.role === "customer"
      ? data.bookingCount
      : user.role === "cleaner"
        ? data.assignmentCount
        : 1;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f7fc] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(30,111,217,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.045) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-[1250px] space-y-6">
        <Link
          href="/admin/admin-users"
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-extrabold text-navy shadow-sm transition hover:border-violet-300 hover:text-violet-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to account directory
        </Link>

        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-[2.25rem] bg-[linear-gradient(125deg,#071d38_0%,#0b315d_52%,#4c3a9e_100%)] p-6 text-white shadow-[0_30px_90px_rgba(11,37,69,0.22)] sm:p-8"
        >
          <div className="absolute -right-20 -top-32 h-80 w-80 rounded-full border border-violet-200/20 bg-violet-300/10" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <span className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.75rem] bg-violet-200 font-heading text-2xl font-black text-violet-900 shadow-[0_20px_45px_rgba(196,181,253,0.2)]">
                {initials(user.name) || "US"}
                <span
                  className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-[#0b315d] ${
                    user.status === "active"
                      ? "bg-emerald-400"
                      : user.status === "suspended"
                        ? "bg-red-400"
                        : "bg-amber-400"
                  }`}
                />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-violet-200">
                    Identity security profile
                  </p>
                  <RoleBadge role={user.role} />
                  <AccountStatusBadge status={user.status} />
                </div>
                <h1 className="mt-3 font-heading text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                  {user.name}
                </h1>
                <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-blue-100/50">
                  Identity ID {user._id}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void toggleAccess()}
              disabled={working}
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-xs font-extrabold transition disabled:opacity-50 ${
                user.status === "suspended"
                  ? "bg-emerald-300 text-navy hover:bg-emerald-200"
                  : "border border-white/10 bg-white/[0.08] text-blue-100 hover:bg-white/[0.14]"
              }`}
            >
              {user.status === "suspended" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Ban className="h-4 w-4 text-amber-300" />
              )}
              {user.status === "suspended" ? "Restore access" : "Suspend account"}
            </button>
          </div>
        </motion.section>

        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
            {errorMessage}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_rgba(11,37,69,0.08)] sm:p-8">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-violet-600">
              Identity information
            </p>
            <h2 className="mt-2 font-heading text-2xl font-black tracking-[-0.03em] text-navy">
              Contact and account context
            </h2>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <InfoCard icon={Mail} label="Email address" value={user.email} />
              <InfoCard icon={Phone} label="Phone number" value={user.phone || "Not provided"} />
              <InfoCard
                icon={CalendarDays}
                label="Identity created"
                value={formatDate(user.createdAt)}
              />
              <InfoCard
                icon={ShieldCheck}
                label="Security state"
                value={
                  user.status === "active"
                    ? "Active access permitted"
                    : user.status === "suspended"
                      ? "Access currently suspended"
                      : "Email verification pending"
                }
              />
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_rgba(11,37,69,0.08)]">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                <CalendarCheck2 className="h-5 w-5" />
              </span>
              <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                {context.label}
              </p>
              <p className="mt-2 font-heading text-4xl font-black tracking-[-0.05em] text-navy">
                {activityValue}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500">{context.description}</p>
              <Link
                href={context.href}
                className="group mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-navy text-xs font-extrabold text-white transition hover:bg-violet-700"
              >
                Open related workspace
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="rounded-[2rem] border border-violet-100 bg-violet-50/60 p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-600">
                  <UserRoundCog className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-heading text-sm font-bold text-navy">Protected actions</p>
                  <p className="text-xs text-slate-500">Server enforced</p>
                </div>
              </div>
              <p className="mt-4 text-xs font-medium leading-5 text-slate-500">
                CleanNest prevents an administrator from suspending or deleting their own active
                identity.
              </p>
            </div>

            <div className="rounded-[2rem] border border-red-100 bg-red-50/70 p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-red-600">
                  <ShieldAlert className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-heading text-sm font-bold text-navy">Danger zone</p>
                  <p className="text-xs text-slate-500">Permanent action</p>
                </div>
              </div>
              <p className="mt-4 text-xs font-medium leading-5 text-slate-500">
                Prefer suspension for temporary restrictions. Deletion is permanent and cannot be
                reversed.
              </p>
              <button
                type="button"
                onClick={() => void deleteUser()}
                disabled={working}
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white text-xs font-extrabold text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete identity
              </button>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/60 p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-4 text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-1.5 break-words text-sm font-bold text-navy">{value}</p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <main className="min-h-screen bg-[#f3f7fc] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1250px] animate-pulse space-y-6">
        <div className="h-10 w-48 rounded-xl bg-slate-200" />
        <div className="h-60 rounded-[2.25rem] bg-navy/10" />
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="h-[390px] rounded-[2rem] bg-white" />
          <div className="h-[310px] rounded-[2rem] bg-white" />
        </div>
      </div>
    </main>
  );
}
