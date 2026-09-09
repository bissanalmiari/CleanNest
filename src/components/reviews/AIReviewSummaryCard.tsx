"use client";

// AI-generated 2-3 sentence summary of a cleaner's last 20 reviews, shown on
// the admin cleaner profile page. Never blocks or breaks the page — shows a
// skeleton while loading and a neutral message if the summary (or its AI
// generation) is unavailable.
import { useEffect } from "react";
import { AlertTriangle, Sparkles } from "lucide-react";
import { useCleanerReviewSummary } from "@/hooks/useCleanerReviewSummary";

function formatGeneratedAt(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Beirut",
  }).format(date);
}

export default function AIReviewSummaryCard({ cleanerId }: { cleanerId: string }) {
  const { summary, loading, error, fetchSummary } = useCleanerReviewSummary();

  useEffect(() => {
    void fetchSummary(cleanerId);
  }, [cleanerId, fetchSummary]);

  const generatedAtLabel = formatGeneratedAt(summary?.summaryGeneratedAt ?? null);

  return (
    <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_rgba(11,37,69,0.08)]">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        <Sparkles className="h-5 w-5" />
      </span>
      <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
        AI review summary
      </p>

      {loading && !summary ? (
        <div className="mt-3 animate-pulse space-y-2">
          <div className="h-3 w-full rounded bg-slate-200" />
          <div className="h-3 w-5/6 rounded bg-slate-200" />
          <div className="h-3 w-2/3 rounded bg-slate-200" />
        </div>
      ) : error && !summary ? (
        <p className="mt-3 flex items-start gap-2 text-sm font-medium leading-6 text-slate-500">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          Summary could not be loaded right now.
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{summary?.aiSummary}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-400">
            {summary && summary.reviewCount > 0 && (
              <span>
                Based on {summary.reviewCount} recent review{summary.reviewCount === 1 ? "" : "s"}
              </span>
            )}
            {generatedAtLabel && (
              <>
                <span aria-hidden="true">&middot;</span>
                <span>Updated {generatedAtLabel}</span>
              </>
            )}
            {summary?.isFallback && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                Showing last available summary
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
