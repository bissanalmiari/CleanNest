"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  LoaderCircle,
  MapPin,
  UserRoundCheck,
} from "lucide-react";

import type { ServiceProofReport } from "@/types/serviceProof";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export default function ServiceProofReportPanel({
  bookingId,
  audience,
}: {
  bookingId: string;
  audience: "admin" | "customer";
}) {
  const [reports, setReports] = useState<ServiceProofReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/proof-reports/${bookingId}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as ApiEnvelope<ServiceProofReport[]>;
        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error ?? "Could not load service report");
        }
        if (active) {
          setReports(
            audience === "customer"
              ? payload.data.filter((report) => report.checkedOutAt)
              : payload.data
          );
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : "Could not load service report"
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [audience, bookingId]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm font-bold text-slate-500">
        <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
        Loading proof of service…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
        {error}
      </div>
    );
  }

  if (reports.length === 0) {
    return audience === "admin" ? (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        <ClipboardCheck className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-3 text-sm font-bold text-slate-500">
          The cleaner has not started a proof-of-service report yet.
        </p>
      </div>
    ) : null;
  }

  return (
    <div className="space-y-5">
      {reports.map((report) => (
        <article
          key={report.id}
          className="overflow-hidden rounded-[24px] border border-slate-200 bg-white"
        >
          <div className="flex flex-col gap-4 bg-gradient-to-r from-[#082744] to-[#0d5b70] p-5 text-white sm:flex-row sm:items-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/15 text-cyan-200">
              <UserRoundCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-cyan-200">
                Cleaning professional
              </p>
              <h3 className="mt-1 font-heading text-lg font-black">{report.cleanerName}</h3>
            </div>
            <span
              className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${
                report.checkedOutAt
                  ? "bg-emerald-400/15 text-emerald-200"
                  : "bg-amber-300/15 text-amber-200"
              }`}
            >
              {report.checkedOutAt ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Clock3 className="h-3.5 w-3.5" />
              )}
              {report.checkedOutAt ? "Finalized" : "In progress"}
            </span>
          </div>

          <div className="p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <ReportFact
                icon={MapPin}
                label="Checked in"
                value={formatTimestamp(report.checkedInAt)}
              />
              <ReportFact
                icon={Clock3}
                label="Checked out"
                value={formatTimestamp(report.checkedOutAt)}
              />
              <ReportFact
                icon={ClipboardCheck}
                label="Checklist"
                value={`${report.progress.completed}/${report.progress.total} completed`}
              />
            </div>

            <div className="mt-5">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary">
                Work completed
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {report.checklist.map((task) => (
                  <div
                    key={task.key}
                    className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold ${
                      task.completed
                        ? "border-emerald-100 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-slate-50 text-slate-400"
                    }`}
                  >
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {task.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <EvidenceGallery label="Before" photos={report.beforePhotos} />
              <EvidenceGallery label="After" photos={report.afterPhotos} />
            </div>

            {report.issues.length > 0 && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-amber-800">
                  <AlertTriangle className="h-4 w-4" /> Reported issues
                </p>
                <div className="mt-3 space-y-2">
                  {report.issues.map((issue, index) => (
                    <p
                      key={`${issue.reportedAt}-${index}`}
                      className="rounded-xl bg-white px-3 py-2.5 text-sm font-semibold leading-6 text-slate-700"
                    >
                      {issue.description}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function formatTimestamp(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function ReportFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div>
        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-1 text-xs font-extrabold text-navy">{value}</p>
      </div>
    </div>
  );
}

function EvidenceGallery({
  label,
  photos,
}: {
  label: string;
  photos: ServiceProofReport["beforePhotos"];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="flex items-center gap-2 text-xs font-black text-navy">
        <Camera className="h-4 w-4 text-primary" /> {label} photos
      </p>
      {photos.length ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((photo) => (
            <a
              key={photo.url}
              href={photo.url}
              target="_blank"
              rel="noreferrer"
              className="group aspect-square overflow-hidden rounded-xl bg-slate-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={`${label} cleaning evidence`}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            </a>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs font-semibold text-slate-400">No photos uploaded.</p>
      )}
    </div>
  );
}
