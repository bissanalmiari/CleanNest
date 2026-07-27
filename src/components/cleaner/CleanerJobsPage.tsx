"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarCheck2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  LoaderCircle,
  MapPin,
  Navigation,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TimerReset,
  UserRound,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import type { CleanerJob, CleanerJobsResponse } from "@/types/cleanerPortal";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const assignmentLabels = {
  assigned: "Needs response",
  accepted: "Accepted",
  declined: "Declined",
  completed: "Completed",
} as const;

function formatDate(value: string, long = false) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    weekday: long ? "long" : "short",
    month: "short",
    day: "numeric",
    ...(long ? { year: "numeric" as const } : {}),
  }).format(date);
}

function statusTone(job: CleanerJob) {
  if (job.status === "in_progress") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }
  if (job.assignmentStatus === "completed" || job.status === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (job.assignmentStatus === "accepted") {
    return "border-cyan-200 bg-cyan-50 text-cyan-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function statusLabel(job: CleanerJob) {
  if (job.status === "in_progress") return "In progress";
  if (job.status === "completed") return "Completed";
  return assignmentLabels[job.assignmentStatus];
}

function JobSkeleton() {
  return (
    <div className="animate-pulse rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex gap-4">
        <div className="h-16 w-16 rounded-2xl bg-slate-100" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-1/4 rounded-full bg-slate-100" />
          <div className="h-6 w-2/3 rounded-full bg-slate-100" />
          <div className="h-4 w-3/4 rounded-full bg-slate-100" />
        </div>
      </div>
      <div className="mt-6 h-16 rounded-2xl bg-slate-50" />
    </div>
  );
}

export default function CleanerJobsPage({
  scope,
}: {
  scope: "today" | "upcoming";
}) {
  const reduceMotion = useReducedMotion();
  const [data, setData] = useState<CleanerJobsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/cleaner/jobs?scope=${scope}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as ApiEnvelope<CleanerJobsResponse>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "Could not load your jobs");
      }
      setData(payload.data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load your jobs",
      );
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  async function act(job: CleanerJob, action: "accept" | "decline") {
    setWorkingId(`${job.id}-${action}`);
    setError(null);
    try {
      const response = await fetch(`/api/cleaner/jobs/${job.id}/action`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = (await response.json()) as ApiEnvelope<unknown>;
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "The job could not be updated");
      }
      await loadJobs();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "The job could not be updated",
      );
    } finally {
      setWorkingId(null);
    }
  }

  const nextJob = data?.jobs[0];
  const acceptedCount = useMemo(
    () =>
      data?.jobs.filter(
        (job) =>
          job.assignmentStatus === "accepted" ||
          job.assignmentStatus === "completed",
      ).length ?? 0,
    [data],
  );

  return (
    <div className="relative isolate min-h-[calc(100vh-76px)] overflow-hidden pb-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_15%_15%,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_85%_0%,rgba(37,99,235,0.16),transparent_30%),linear-gradient(180deg,#071f3d_0%,#0b3154_62%,transparent_100%)]" />

      <div className="mx-auto max-w-[1240px] px-4 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[32px] border border-white/15 bg-white/[0.07] p-6 text-white shadow-[0_35px_90px_rgba(3,18,37,0.28)] backdrop-blur-md sm:p-8 lg:p-10"
        >
          <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border-[42px] border-cyan-300/10" />
          <div className="relative grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Cleaner command center
              </div>
              <h1 className="max-w-3xl font-heading text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                {scope === "today"
                  ? "Your route for today."
                  : "Your upcoming schedule."}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100/80 sm:text-base">
                {scope === "today"
                  ? "Everything you need for a smooth shift—customers, locations, timing, and live job actions."
                  : "Review new assignments early, accept your work, and arrive prepared for every home."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadJobs()}
              disabled={loading}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/20 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh schedule
            </button>
          </div>

          <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
            <Metric
              icon={BriefcaseBusiness}
              label={scope === "today" ? "Jobs today" : "Upcoming jobs"}
              value={data?.summary.total ?? 0}
            />
            <Metric
              icon={ShieldCheck}
              label="Accepted"
              value={acceptedCount}
            />
            <Metric
              icon={TimerReset}
              label="Awaiting reply"
              value={data?.summary.assigned ?? 0}
            />
          </div>
        </motion.section>

        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700 shadow-sm"
          >
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-auto rounded-lg p-1 hover:bg-rose-100"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
                  Work queue
                </p>
                <h2 className="mt-1 font-heading text-2xl font-black text-navy">
                  {scope === "today" ? "Today’s visits" : "Scheduled visits"}
                </h2>
              </div>
              {data && (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-slate-500 shadow-sm">
                  {data.jobs.length} {data.jobs.length === 1 ? "job" : "jobs"}
                </span>
              )}
            </div>

            <div className="space-y-4">
              {loading &&
                Array.from({ length: 3 }).map((_, index) => (
                  <JobSkeleton key={index} />
                ))}

              {!loading && data?.jobs.length === 0 && (
                <div className="rounded-[30px] border border-dashed border-slate-300 bg-white/80 px-6 py-16 text-center shadow-sm">
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-8 w-8" />
                  </span>
                  <h3 className="mt-5 font-heading text-xl font-black text-navy">
                    {scope === "today"
                      ? "Your route is clear"
                      : "No upcoming assignments"}
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    {scope === "today"
                      ? "You have no assigned visits today. Enjoy the breathing room."
                      : "New jobs assigned by the operations team will appear here automatically."}
                  </p>
                </div>
              )}

              {!loading &&
                data?.jobs.map((job, index) => (
                  <motion.article
                    key={job.assignmentId}
                    initial={
                      reduceMotion ? false : { opacity: 0, y: 16, scale: 0.99 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="group overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_14px_44px_rgba(15,42,72,0.07)] transition hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_22px_55px_rgba(15,42,72,0.12)]"
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col gap-5 sm:flex-row">
                        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-[#155681] text-white shadow-lg shadow-navy/15">
                          <span className="text-[10px] font-black uppercase tracking-wider text-cyan-200">
                            {formatDate(job.bookingDate).split(" ")[0]}
                          </span>
                          <span className="text-2xl font-black leading-none">
                            {new Date(`${job.bookingDate}T12:00:00`).getDate()}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${statusTone(job)}`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {statusLabel(job)}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                              #{job.bookingNumber}
                            </span>
                          </div>
                          <h3 className="mt-3 font-heading text-xl font-black text-navy">
                            {job.serviceName}
                          </h3>
                          <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                            <span className="flex items-center gap-2">
                              <Clock3 className="h-4 w-4 text-primary" />
                              <strong className="font-extrabold text-navy">
                                {job.startTime} – {job.endTime}
                              </strong>
                            </span>
                            <span className="flex items-center gap-2">
                              <UserRound className="h-4 w-4 text-primary" />
                              {job.customerName}
                            </span>
                          </div>
                          <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-slate-500">
                            <MapPin className="mt-1 h-4 w-4 shrink-0 text-primary" />
                            <span>{job.addressLine}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/75 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                      {job.assignmentStatus === "assigned" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void act(job, "accept")}
                            disabled={workingId !== null}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/15 transition hover:bg-emerald-700 disabled:opacity-55"
                          >
                            {workingId === `${job.id}-accept` ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            Accept job
                          </button>
                          <button
                            type="button"
                            onClick={() => void act(job, "decline")}
                            disabled={workingId !== null}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-extrabold text-slate-600 transition hover:border-rose-200 hover:text-rose-600 disabled:opacity-55"
                          >
                            Decline
                          </button>
                        </>
                      ) : (
                        <span className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <Navigation className="h-4 w-4 text-primary" />
                          {job.status === "in_progress"
                            ? "Service is active"
                            : "Open the job for instructions and actions"}
                        </span>
                      )}
                      <Link
                        href={`/cleaner/jobs/${job.id}`}
                        className="ml-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-navy px-5 text-sm font-extrabold text-white transition hover:bg-primary"
                      >
                        View job
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </motion.article>
                ))}
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0b294a] to-[#0d5a75] p-6 text-white shadow-[0_22px_55px_rgba(11,41,74,0.2)]">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/15 text-cyan-200">
                <Navigation className="h-5 w-5" />
              </span>
              <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">
                Next route point
              </p>
              <h3 className="mt-2 font-heading text-xl font-black">
                {nextJob ? nextJob.serviceName : "No visit queued"}
              </h3>
              {nextJob && (
                <>
                  <p className="mt-2 text-sm leading-6 text-blue-100/75">
                    {formatDate(nextJob.bookingDate, true)} at{" "}
                    {nextJob.startTime}
                  </p>
                  <Link
                    href={`/cleaner/jobs/${nextJob.id}`}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-black text-cyan-200 hover:text-white"
                  >
                    Open route details <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              )}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CalendarCheck2 className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-heading text-lg font-black text-navy">
                Keep your schedule accurate
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Set the days and hours you can work so operations can assign the
                right visits.
              </p>
              <Link
                href="/cleaner/availability"
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/15 bg-primary-light text-sm font-extrabold text-primary transition hover:bg-primary hover:text-white"
              >
                Manage availability
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BriefcaseBusiness;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-2xl font-black">{value}</p>
        <p className="text-xs font-semibold text-blue-100/65">{label}</p>
      </div>
    </div>
  );
}
