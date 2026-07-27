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
  Pencil,
  Phone,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import CleanerFormModal, {
  type CleanerFormValues,
  type CleanerRow,
} from "@/components/cleaners/CleanerFormModal";
import { AccountStatusBadge } from "@/components/users/UserBadges";

interface CleanerDetail extends CleanerRow {
  status: string;
  createdAt: string;
}

interface CleanerDetailData {
  user: CleanerDetail;
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

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Beirut",
  }).format(date);
}

export default function AdminCleanerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const cleanerId = params.id;
  const [data, setData] = useState<CleanerDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const fetchCleaner = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);

      try {
        const response = await fetch(`/api/admin/cleaners/${cleanerId}`, {
          cache: "no-store",
        });
        const json: ApiEnvelope<CleanerDetailData> = await response.json();

        if (!response.ok || !json.success || !json.data) {
          throw new Error(json.error ?? "Cleaner could not be loaded.");
        }

        setData(json.data);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Cleaner could not be loaded.");
      } finally {
        setLoading(false);
      }
    },
    [cleanerId]
  );

  useEffect(() => {
    void fetchCleaner();
  }, [fetchCleaner]);

  async function updateCleaner(values: CleanerFormValues) {
    const response = await fetch(`/api/admin/cleaners/${cleanerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        email: values.email,
        phone: values.phone || null,
      }),
    });
    const json: ApiEnvelope<CleanerDetail> = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(json.error ?? "Cleaner could not be updated.");
    }

    setEditOpen(false);
    await fetchCleaner(true);
  }

  async function toggleAccess() {
    if (!data) return;
    const action = data.user.status === "suspended" ? "unblock" : "block";

    if (
      !window.confirm(
        action === "block"
          ? `Suspend ${data.user.name}? They will not be able to access cleaner assignments.`
          : `Restore team access for ${data.user.name}?`
      )
    ) {
      return;
    }

    setWorking(true);
    try {
      const response = await fetch(`/api/admin/cleaners/${cleanerId}/block`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json: ApiEnvelope<unknown> = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error ?? "Account status could not be changed.");
      }
      await fetchCleaner(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "The action failed.");
    } finally {
      setWorking(false);
    }
  }

  async function deleteCleaner() {
    if (!data) return;
    if (!window.confirm(`Permanently delete ${data.user.name}? This action cannot be undone.`)) {
      return;
    }

    setWorking(true);
    try {
      const response = await fetch(`/api/admin/cleaners/${cleanerId}`, {
        method: "DELETE",
      });
      const json: ApiEnvelope<unknown> = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error ?? "Cleaner could not be deleted.");
      }
      router.replace("/admin/cleaners");
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
          <h1 className="mt-5 font-heading text-2xl font-black text-navy">Cleaner unavailable</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            {errorMessage ?? "This cleaner could not be found."}
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/admin/cleaners"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-extrabold text-navy"
            >
              <ArrowLeft className="h-4 w-4" />
              Cleaners
            </Link>
            <button
              type="button"
              onClick={() => void fetchCleaner()}
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

  const cleaner = data.user;

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
          href="/admin/cleaners"
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-extrabold text-navy shadow-sm transition hover:border-emerald-300 hover:text-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to cleaner team
        </Link>

        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-[2.25rem] bg-[linear-gradient(125deg,#071d38_0%,#0b315d_52%,#087f8c_100%)] p-6 text-white shadow-[0_30px_90px_rgba(11,37,69,0.22)] sm:p-8"
        >
          <div className="absolute -right-20 -top-32 h-80 w-80 rounded-full border border-emerald-200/20 bg-emerald-300/10" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <span className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.75rem] bg-emerald-300 font-heading text-2xl font-black text-navy shadow-[0_20px_45px_rgba(52,211,153,0.2)]">
                {initials(cleaner.name) || "CL"}
                <span
                  className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-[#0b315d] ${
                    cleaner.status === "active" ? "bg-emerald-400" : "bg-red-400"
                  }`}
                />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-300">
                    Cleaner team profile
                  </p>
                  <AccountStatusBadge status={cleaner.status} />
                </div>
                <h1 className="mt-3 font-heading text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                  {cleaner.name}
                </h1>
                <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-blue-100/50">
                  Team ID {cleaner._id}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-5 text-xs font-extrabold text-navy transition hover:bg-emerald-50"
              >
                <Pencil className="h-4 w-4 text-emerald-700" />
                Edit profile
              </button>
              <button
                type="button"
                onClick={() => void toggleAccess()}
                disabled={working}
                className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.08] px-5 text-xs font-extrabold text-blue-100 transition hover:bg-white/[0.14] disabled:opacity-50"
              >
                {cleaner.status === "suspended" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                ) : (
                  <Ban className="h-4 w-4 text-amber-300" />
                )}
                {cleaner.status === "suspended" ? "Restore access" : "Suspend account"}
              </button>
            </div>
          </div>
        </motion.section>

        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
            {errorMessage}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_rgba(11,37,69,0.08)] sm:p-8">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-700">
              Team member information
            </p>
            <h2 className="mt-2 font-heading text-2xl font-black tracking-[-0.03em] text-navy">
              Contact and access details
            </h2>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <InfoCard icon={Mail} label="Work email" value={cleaner.email} />
              <InfoCard icon={Phone} label="Phone number" value={cleaner.phone || "Not provided"} />
              <InfoCard
                icon={CalendarDays}
                label="Team member since"
                value={formatDate(cleaner.createdAt)}
              />
              <InfoCard
                icon={ShieldCheck}
                label="Assignment access"
                value={
                  cleaner.status === "active"
                    ? "Active and assignable"
                    : "Access currently suspended"
                }
              />
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_rgba(11,37,69,0.08)]">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <CalendarCheck2 className="h-5 w-5" />
              </span>
              <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                Assignment activity
              </p>
              <p className="mt-2 font-heading text-4xl font-black tracking-[-0.05em] text-navy">
                {data.assignmentCount}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Total booking assignments connected to this cleaner
              </p>
              <Link
                href="/admin/bookings"
                className="group mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-navy text-xs font-extrabold text-white transition hover:bg-emerald-700"
              >
                Open booking management
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="rounded-[2rem] border border-red-100 bg-red-50/70 p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-red-600">
                  <Trash2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-heading text-sm font-bold text-navy">Danger zone</p>
                  <p className="text-xs text-slate-500">Permanent action</p>
                </div>
              </div>
              <p className="mt-4 text-xs font-medium leading-5 text-slate-500">
                Suspend access for temporary restrictions. Deletion is permanent and should only be
                used when required.
              </p>
              <button
                type="button"
                onClick={() => void deleteCleaner()}
                disabled={working}
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white text-xs font-extrabold text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete cleaner
              </button>
            </div>
          </aside>
        </section>
      </div>

      <CleanerFormModal
        open={editOpen}
        cleaner={cleaner}
        onClose={() => setEditOpen(false)}
        onSubmit={updateCleaner}
      />
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
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
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
        <div className="h-10 w-44 rounded-xl bg-slate-200" />
        <div className="h-60 rounded-[2.25rem] bg-navy/10" />
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="h-[390px] rounded-[2rem] bg-white" />
          <div className="h-[310px] rounded-[2rem] bg-white" />
        </div>
      </div>
    </main>
  );
}
