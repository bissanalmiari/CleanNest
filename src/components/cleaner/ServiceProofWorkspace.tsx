"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  ImagePlus,
  LoaderCircle,
  MapPin,
  ShieldAlert,
  Upload,
} from "lucide-react";

import type { ServiceProofReport } from "@/types/serviceProof";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export default function ServiceProofWorkspace({
  bookingId,
  bookingStatus,
  assignmentStatus,
  onProofChange,
}: {
  bookingId: string;
  bookingStatus: string;
  assignmentStatus: string;
  onProofChange: (proof: ServiceProofReport) => void;
}) {
  const [proof, setProof] = useState<ServiceProofReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [workingKey, setWorkingKey] = useState<string | null>(null);
  const [uploadingStage, setUploadingStage] = useState<"before" | "after" | null>(null);
  const [issue, setIssue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const beforeInput = useRef<HTMLInputElement>(null);
  const afterInput = useRef<HTMLInputElement>(null);

  const applyProof = useCallback(
    (nextProof: ServiceProofReport) => {
      setProof(nextProof);
      onProofChange(nextProof);
    },
    [onProofChange]
  );

  const loadProof = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/cleaner/jobs/${bookingId}/proof`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as ApiEnvelope<ServiceProofReport>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "Could not load service proof");
      }
      applyProof(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load service proof");
    } finally {
      setLoading(false);
    }
  }, [applyProof, bookingId]);

  useEffect(() => {
    if (assignmentStatus !== "assigned" && assignmentStatus !== "declined") {
      void loadProof();
    } else {
      setLoading(false);
    }
  }, [assignmentStatus, bookingStatus, loadProof]);

  async function toggleTask(key: string, completed: boolean) {
    setWorkingKey(key);
    setError(null);
    try {
      const response = await fetch(`/api/cleaner/jobs/${bookingId}/proof`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_task", key, completed }),
      });
      const payload = (await response.json()) as ApiEnvelope<ServiceProofReport>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "Checklist could not be updated");
      }
      applyProof(payload.data);
    } catch (taskError) {
      setError(taskError instanceof Error ? taskError.message : "Checklist could not be updated");
    } finally {
      setWorkingKey(null);
    }
  }

  async function uploadPhoto(stage: "before" | "after", file?: File) {
    if (!file) return;
    setUploadingStage(stage);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("stage", stage);
      const response = await fetch(`/api/cleaner/jobs/${bookingId}/proof/upload`, {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as ApiEnvelope<ServiceProofReport>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "Photo upload failed");
      }
      applyProof(payload.data);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Photo upload failed");
    } finally {
      setUploadingStage(null);
      if (beforeInput.current) beforeInput.current.value = "";
      if (afterInput.current) afterInput.current.value = "";
    }
  }

  async function reportIssue() {
    if (!issue.trim()) return;
    setWorkingKey("issue");
    setError(null);
    try {
      const response = await fetch(`/api/cleaner/jobs/${bookingId}/proof`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "report_issue",
          description: issue,
        }),
      });
      const payload = (await response.json()) as ApiEnvelope<ServiceProofReport>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "Issue could not be reported");
      }
      applyProof(payload.data);
      setIssue("");
    } catch (issueError) {
      setError(issueError instanceof Error ? issueError.message : "Issue could not be reported");
    } finally {
      setWorkingKey(null);
    }
  }

  if (assignmentStatus === "assigned") {
    return (
      <section className="rounded-[28px] border border-dashed border-slate-300 bg-white p-7 text-center shadow-sm">
        <ClipboardCheck className="mx-auto h-10 w-10 text-slate-300" />
        <h2 className="mt-4 font-heading text-xl font-black text-navy">
          Acknowledge the job to open its work checklist
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Confirm that you have seen this assigned job to prepare its checklist and photo report.
        </p>
      </section>
    );
  }

  if (loading || !proof) {
    return (
      <section className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
          <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
          Preparing the service checklist…
        </div>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      </section>
    );
  }

  const locked = !proof.checkedInAt || Boolean(proof.checkedOutAt);

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_44px_rgba(15,42,72,0.06)]">
      <div className="bg-gradient-to-r from-[#082744] to-[#0d5b70] p-5 text-white sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-300/15 text-cyan-200">
            <ClipboardCheck className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">
              Proof of service
            </p>
            <h2 className="mt-1 font-heading text-xl font-black">Live quality checklist</h2>
          </div>
          <div className="min-w-40">
            <div className="flex items-center justify-between text-xs font-bold text-blue-100/70">
              <span>
                {proof.progress.completed}/{proof.progress.total} tasks
              </span>
              <span>{proof.progress.percentage}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-400 transition-all duration-500"
                style={{ width: `${proof.progress.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        <div
          className={`mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3 ${
            proof.checkedOutAt
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : proof.checkedInAt
                ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {proof.checkedOutAt ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <MapPin className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          <div>
            <p className="text-sm font-black">
              {proof.checkedOutAt
                ? "Service report finalized"
                : proof.checkedInAt
                  ? "Checked in — checklist is active"
                  : proof.onMyWayAt
                    ? "On the way — the customer has been notified"
                    : "Check in and start the service to unlock this checklist"}
            </p>
            {proof.checkedInAt && (
              <p className="mt-1 text-xs font-semibold opacity-70">
                Arrival recorded{" "}
                {new Intl.DateTimeFormat("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(proof.checkedInAt))}
              </p>
            )}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-primary">
            Required tasks
          </p>
          <div className="mt-3 grid gap-3">
            {proof.checklist.map((task) => (
              <button
                key={task.key}
                type="button"
                disabled={locked || workingKey !== null}
                onClick={() => void toggleTask(task.key, !task.completed)}
                className={`flex min-h-14 items-center gap-3 rounded-2xl border px-4 text-left transition disabled:cursor-not-allowed ${
                  task.completed
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-slate-50 hover:border-primary/25"
                } ${locked ? "opacity-65" : ""}`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                    task.completed
                      ? "bg-emerald-500 text-white"
                      : "border-2 border-slate-300 bg-white text-transparent"
                  }`}
                >
                  {workingKey === task.key ? (
                    <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </span>
                <span
                  className={`text-sm font-bold ${
                    task.completed ? "text-emerald-800" : "text-navy"
                  }`}
                >
                  {task.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <PhotoStage
            stage="before"
            title="Before cleaning · Optional"
            description="Add a photo if it helps document the starting condition."
            photos={proof.beforePhotos}
            inputRef={beforeInput}
            uploading={uploadingStage === "before"}
            disabled={Boolean(proof.checkedOutAt)}
            onFile={(file) => void uploadPhoto("before", file)}
          />
          <PhotoStage
            stage="after"
            title="After cleaning · Optional"
            description="Add a photo if you want to document the finished result."
            photos={proof.afterPhotos}
            inputRef={afterInput}
            uploading={uploadingStage === "after"}
            disabled={!proof.checkedInAt || Boolean(proof.checkedOutAt)}
            onFile={(file) => void uploadPhoto("after", file)}
          />
        </div>

        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <h3 className="font-heading text-base font-black text-navy">Report an issue</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Record access problems, existing damage, missing supplies, or anything operations
                should know.
              </p>
            </div>
          </div>
          {!proof.checkedOutAt && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <textarea
                value={issue}
                onChange={(event) => setIssue(event.target.value)}
                maxLength={1000}
                rows={2}
                placeholder="Describe what happened…"
                className="min-h-20 flex-1 resize-none rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-navy outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-200/40"
              />
              <button
                type="button"
                onClick={() => void reportIssue()}
                disabled={!issue.trim() || workingKey !== null}
                className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-xl bg-amber-600 px-5 text-sm font-black text-white transition hover:bg-amber-700 disabled:opacity-50"
              >
                {workingKey === "issue" && <LoaderCircle className="h-4 w-4 animate-spin" />}
                Save issue
              </button>
            </div>
          )}
          {proof.issues.length > 0 && (
            <div className="mt-4 space-y-2">
              {proof.issues.map((reportedIssue, index) => (
                <div
                  key={`${reportedIssue.reportedAt}-${index}`}
                  className="rounded-xl border border-amber-100 bg-white px-4 py-3"
                >
                  <p className="text-sm font-semibold leading-6 text-slate-700">
                    {reportedIssue.description}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(reportedIssue.reportedAt))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className={`mt-6 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-bold ${
            proof.progress.readyToComplete
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {proof.progress.readyToComplete ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          {proof.progress.readyToComplete
            ? "Every required task is complete. You can finish your work."
            : "Complete every checklist task before finishing. Photos are optional."}
        </div>
      </div>
    </section>
  );
}

function PhotoStage({
  stage,
  title,
  description,
  photos,
  inputRef,
  uploading,
  disabled,
  onFile,
}: {
  stage: "before" | "after";
  title: string;
  description: string;
  photos: ServiceProofReport["beforePhotos"];
  inputRef: React.RefObject<HTMLInputElement | null>;
  uploading: boolean;
  disabled: boolean;
  onFile: (file?: File) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            stage === "before" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          <Camera className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-sm font-black text-navy">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
        <span className="ml-auto rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-slate-500">
          {photos.length}/5
        </span>
      </div>

      {photos.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((photo) => (
            <a
              key={photo.url}
              href={photo.url}
              target="_blank"
              rel="noreferrer"
              className="group relative aspect-square overflow-hidden rounded-xl bg-slate-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={`${stage} service evidence`}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            </a>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => onFile(event.target.files?.[0])}
      />
      <button
        type="button"
        disabled={disabled || uploading || photos.length >= 5}
        onClick={() => inputRef.current?.click()}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-white text-sm font-black text-primary transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : photos.length ? (
          <ImagePlus className="h-4 w-4" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {uploading ? "Uploading…" : "Add photo"}
      </button>
    </div>
  );
}
