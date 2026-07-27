"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  DoorOpen,
  ExternalLink,
  House,
  KeyRound,
  LoaderCircle,
  MapPin,
  Navigation,
  NotebookText,
  Phone,
  Play,
  ShieldCheck,
  Sparkles,
  TestTube2,
  UserRound,
  WalletCards,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import ServiceProofWorkspace from "@/components/cleaner/ServiceProofWorkspace";
import type { CleanerJob } from "@/types/cleanerPortal";
import type { ServiceProofReport } from "@/types/serviceProof";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

type JobAction = "accept" | "on_my_way" | "start" | "demo_start" | "complete";

const DEMO_CHECK_IN_ENABLED =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ENABLE_DEMO_CHECK_IN === "true";

function optionalBrowserLocation(): Promise<
  | {
      latitude: number;
      longitude: number;
      accuracy?: number;
    }
  | undefined
> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(undefined);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      () => resolve(undefined),
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
    );
  });
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function CleanerJobDetail({ bookingId }: { bookingId: string }) {
  const reduceMotion = useReducedMotion();
  const [job, setJob] = useState<CleanerJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<JobAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proof, setProof] = useState<ServiceProofReport | null>(null);
  const [proofRevision, setProofRevision] = useState(0);

  const loadJob = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/cleaner/jobs/${bookingId}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as ApiEnvelope<CleanerJob>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "Could not load this job");
      }
      setJob(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load this job");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void loadJob();
  }, [loadJob]);

  async function performAction(action: JobAction) {
    if (
      (action === "complete" &&
        !window.confirm("Confirm that your work at this job is complete?")) ||
      (action === "demo_start" &&
        !window.confirm(
          "Use testing check-in? This bypasses only the scheduled-day restriction and starts the demo job."
        ))
    ) {
      return;
    }

    setWorking(action);
    setError(null);
    try {
      const location =
        action === "start" || action === "demo_start" ? await optionalBrowserLocation() : undefined;
      const response = await fetch(`/api/cleaner/jobs/${bookingId}/action`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, location }),
      });
      const payload = (await response.json()) as ApiEnvelope<unknown>;
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "The job could not be updated");
      }
      await loadJob();
      setProofRevision((current) => current + 1);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "The job could not be updated");
    } finally {
      setWorking(null);
    }
  }

  const directionsUrl = useMemo(
    () =>
      job
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.addressLine)}`
        : "#",
    [job]
  );
  const handleProofChange = useCallback((nextProof: ServiceProofReport) => {
    setProof(nextProof);
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="animate-pulse rounded-[32px] bg-navy p-8">
          <div className="h-4 w-36 rounded bg-white/10" />
          <div className="mt-5 h-10 w-2/3 rounded bg-white/10" />
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="h-20 rounded-2xl bg-white/10" />
            <div className="h-20 rounded-2xl bg-white/10" />
            <div className="h-20 rounded-2xl bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <CircleAlert className="mx-auto h-12 w-12 text-rose-500" />
        <h1 className="mt-5 font-heading text-2xl font-black text-navy">Job unavailable</h1>
        <p className="mt-2 text-slate-500">
          {error ?? "This job was not found in your assignments."}
        </p>
        <Link
          href="/cleaner/today"
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-navy px-5 font-bold text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to today
        </Link>
      </div>
    );
  }

  const isDone = job.assignmentStatus === "completed" || job.status === "completed";
  const canStart =
    job.assignmentStatus === "accepted" &&
    (job.status === "confirmed" || job.status === "in_progress") &&
    !proof?.checkedInAt;
  const canGoOnMyWay =
    job.assignmentStatus === "accepted" &&
    (job.status === "confirmed" || job.status === "in_progress") &&
    !proof?.onMyWayAt &&
    !proof?.checkedInAt;
  const canComplete =
    job.assignmentStatus === "accepted" &&
    job.status === "in_progress" &&
    Boolean(proof?.checkedInAt);

  return (
    <div className="relative isolate overflow-hidden pb-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[470px] bg-[radial-gradient(circle_at_80%_10%,rgba(34,211,238,0.16),transparent_30%),linear-gradient(135deg,#071f3d,#0b4163)]" />
      <div className="mx-auto max-w-[1180px] px-4 pt-7 sm:px-6 lg:px-8 lg:pt-10">
        <Link
          href="/cleaner/today"
          className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-blue-100/80 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to my route
        </Link>

        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[32px] border border-white/15 bg-white/[0.08] p-6 text-white shadow-[0_35px_85px_rgba(3,18,37,0.28)] backdrop-blur-md sm:p-8"
        >
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full border-[50px] border-cyan-300/10" />
          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">
                  #{job.bookingNumber}
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em]">
                  {job.status === "in_progress" ? "In progress" : titleCase(job.assignmentStatus)}
                </span>
              </div>
              <h1 className="mt-5 font-heading text-3xl font-black sm:text-4xl">
                {job.serviceName}
              </h1>
              <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-blue-100/75">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-cyan-200" />
                {job.addressLine}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {job.assignmentStatus === "assigned" && (
                <ActionButton
                  label="Acknowledge assignment"
                  icon={Check}
                  loading={working === "accept"}
                  disabled={working !== null}
                  onClick={() => void performAction("accept")}
                  tone="success"
                />
              )}
              {canStart && (
                <>
                  {canGoOnMyWay && (
                    <ActionButton
                      label="On my way"
                      icon={Navigation}
                      loading={working === "on_my_way"}
                      disabled={working !== null}
                      onClick={() => void performAction("on_my_way")}
                      tone="ghost"
                    />
                  )}
                  <ActionButton
                    label={job.status === "in_progress" ? "Check in" : "Check in & start"}
                    icon={Play}
                    loading={working === "start"}
                    disabled={working !== null}
                    onClick={() => void performAction("start")}
                    tone="success"
                  />
                  {DEMO_CHECK_IN_ENABLED && (
                    <ActionButton
                      label="Check in for testing"
                      icon={TestTube2}
                      loading={working === "demo_start"}
                      disabled={working !== null}
                      onClick={() => void performAction("demo_start")}
                      tone="demo"
                    />
                  )}
                </>
              )}
              {canComplete && (
                <ActionButton
                  label="Finish my work"
                  icon={CheckCircle2}
                  loading={working === "complete"}
                  disabled={working !== null || !proof?.progress.readyToComplete}
                  onClick={() => void performAction("complete")}
                  tone="success"
                />
              )}
              {isDone && (
                <span className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-emerald-400/15 px-5 text-sm font-black text-emerald-200">
                  <CheckCircle2 className="h-5 w-5" /> Work completed
                </span>
              )}
            </div>
          </div>

          <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
            <HeroFact
              icon={CalendarDays}
              label="Scheduled date"
              value={formatDate(job.bookingDate)}
            />
            <HeroFact
              icon={Clock3}
              label="Service window"
              value={`${job.startTime} – ${job.endTime}`}
            />
            <HeroFact icon={UserRound} label="Customer" value={job.customerName} />
          </div>
        </motion.section>

        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {DEMO_CHECK_IN_ENABLED && canStart && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-900">
            <TestTube2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-black">Presentation testing mode</p>
              <p className="mt-1 leading-6 text-amber-800">
                The normal check-in still proves the scheduled-day protection. Use “Check in for
                testing” afterward to continue the demonstration without changing that real rule.
              </p>
            </div>
          </div>
        )}

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <ServiceProofWorkspace
              key={`${bookingId}-${proofRevision}`}
              bookingId={bookingId}
              bookingStatus={job.status}
              assignmentStatus={job.assignmentStatus}
              onProofChange={handleProofChange}
            />

            <DetailSection eyebrow="Arrival brief" title="Customer & location" icon={Navigation}>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoTile icon={UserRound} label="Customer" value={job.customerName} />
                <InfoTile
                  icon={Phone}
                  label="Contact phone"
                  value={job.customerPhone ?? "Not provided"}
                  href={job.customerPhone ? `tel:${job.customerPhone}` : undefined}
                />
              </div>
              <div className="mt-4 rounded-2xl border border-primary/10 bg-primary-light/35 p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-primary">
                      {job.addressLabel}
                    </p>
                    <p className="mt-1 text-sm font-bold leading-6 text-navy">{job.addressLine}</p>
                    {job.landmark && (
                      <p className="mt-2 text-xs text-slate-500">Landmark: {job.landmark}</p>
                    )}
                  </div>
                </div>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-extrabold text-white transition hover:bg-primary-dark"
                >
                  Open directions <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </DetailSection>

            <DetailSection eyebrow="Service scope" title="Home details" icon={House}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <InfoTile icon={Building2} label="Property" value={titleCase(job.propertyType)} />
                <InfoTile
                  icon={DoorOpen}
                  label="Bedrooms"
                  value={job.bedrooms?.toString() ?? "—"}
                />
                <InfoTile
                  icon={Sparkles}
                  label="Bathrooms"
                  value={job.bathrooms?.toString() ?? "—"}
                />
                <InfoTile
                  icon={House}
                  label="Property size"
                  value={job.propertySize ? `${job.propertySize} m²` : "—"}
                />
              </div>
            </DetailSection>

            <DetailSection
              eyebrow="Before you begin"
              title="Instructions & notes"
              icon={NotebookText}
            >
              <div className="space-y-3">
                <Note icon={KeyRound} label="Access instructions" value={job.accessInstructions} />
                <Note icon={UserRound} label="Customer notes" value={job.customerNotes} />
                <Note icon={ShieldCheck} label="Operations notes" value={job.adminNotes} />
              </div>
            </DetailSection>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,42,72,0.08)]">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <WalletCards className="h-6 w-6" />
              </span>
              <h2 className="mt-5 font-heading text-xl font-black text-navy">Payment brief</h2>
              <div className="mt-5 space-y-4">
                <SummaryRow label="Method" value={titleCase(job.paymentMethod)} />
                <SummaryRow label="Status" value={titleCase(job.paymentStatus)} />
                <SummaryRow
                  label="Duration"
                  value={
                    job.estimatedDurationMinutes
                      ? `${Math.round(job.estimatedDurationMinutes / 60)} hours`
                      : "See service window"
                  }
                />
              </div>
              <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-800">
                Never collect a different amount or change payment details without contacting
                operations.
              </p>
            </div>

            <div className="rounded-[28px] bg-navy p-6 text-white shadow-xl shadow-navy/15">
              <Clock3 className="h-6 w-6 text-cyan-300" />
              <h3 className="mt-4 font-heading text-lg font-black">Keep the status live</h3>
              <p className="mt-2 text-sm leading-6 text-blue-100/70">
                Start the service when work begins and complete it when your assigned work is
                finished. This keeps the customer and operations in sync.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  label,
  icon: Icon,
  loading,
  disabled,
  onClick,
  tone,
}: {
  label: string;
  icon: typeof Check;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  tone: "success" | "ghost" | "demo";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black transition disabled:cursor-wait disabled:opacity-55 ${
        tone === "success"
          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
          : tone === "demo"
            ? "bg-amber-400 text-amber-950 shadow-lg shadow-amber-500/20 hover:bg-amber-300"
            : "border border-white/15 bg-white/10 text-white hover:bg-white/20"
      }`}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {label}
    </button>
  );
}

function HeroFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-blue-100/55">
          {label}
        </p>
        <p className="mt-1 truncate text-sm font-extrabold">{value}</p>
      </div>
    </div>
  );
}

function DetailSection({
  eyebrow,
  title,
  icon: Icon,
  children,
}: {
  eyebrow: string;
  title: string;
  icon: typeof Navigation;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_44px_rgba(15,42,72,0.06)] sm:p-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-light text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">
            {eyebrow}
          </p>
          <h2 className="mt-1 font-heading text-xl font-black text-navy">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <Icon className="h-4 w-4 text-primary" />
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-extrabold text-navy">{value}</p>
      </div>
    </>
  );
  return href ? (
    <a
      href={href}
      className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-primary/20"
    >
      {content}
    </a>
  ) : (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      {content}
    </div>
  );
}

function Note({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof KeyRound;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
          {value || "No special instructions provided."}
        </p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 text-sm last:border-0 last:pb-0">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="text-right font-extrabold text-navy">{value}</span>
    </div>
  );
}
