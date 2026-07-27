"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  CalendarCheck2,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  CreditCard,
  Download,
  RefreshCw,
  Sparkles,
  Target,
  Trophy,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import RevenueTrendChart from "@/components/reports/RevenueTrendChart";

type ReportRange = "week" | "month" | "year" | "all";
type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface RevenuePoint {
  date: string;
  revenue: number;
  count: number;
}

interface RevenueReport {
  totalRevenue: number;
  transactionCount: number;
  averageTransactionValue: number;
  series: RevenuePoint[];
}

interface BookingReport {
  totalBookings: number;
  statusBreakdown: Record<BookingStatus, number>;
  completionRate: number;
  series: Array<{ date: string; count: number }>;
}

interface PopularServiceRow {
  serviceId: string;
  serviceName: string;
  category: string;
  bookingCount: number;
  revenue: number;
}

const RANGE_OPTIONS: Array<{
  value: ReportRange;
  label: string;
  shortLabel: string;
}> = [
  { value: "week", label: "Last 7 days", shortLabel: "7D" },
  { value: "month", label: "Last 30 days", shortLabel: "30D" },
  { value: "year", label: "Last 12 months", shortLabel: "12M" },
  { value: "all", label: "All time", shortLabel: "All" },
];

const EMPTY_BREAKDOWN: Record<BookingStatus, number> = {
  pending: 0,
  confirmed: 0,
  in_progress: 0,
  completed: 0,
  cancelled: 0,
};

const STATUS_META: Record<
  BookingStatus,
  {
    label: string;
    icon: typeof ClipboardList;
    color: string;
    bar: string;
    dot: string;
  }
> = {
  pending: {
    label: "Pending",
    icon: Clock3,
    color: "bg-amber-50 text-amber-700",
    bar: "bg-amber-400",
    dot: "#f59e0b",
  },
  confirmed: {
    label: "Confirmed",
    icon: CalendarCheck2,
    color: "bg-blue-50 text-blue-700",
    bar: "bg-blue-500",
    dot: "#3b82f6",
  },
  in_progress: {
    label: "In progress",
    icon: Sparkles,
    color: "bg-cyan-50 text-cyan-700",
    bar: "bg-cyan-500",
    dot: "#06b6d4",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "bg-emerald-50 text-emerald-700",
    bar: "bg-emerald-500",
    dot: "#10b981",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "bg-red-50 text-red-700",
    bar: "bg-red-400",
    dot: "#f87171",
  },
};

function formatMoney(value: number, compact = false) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
  }).format(value);
}

function percent(value: number) {
  return `${Math.min(100, Math.max(0, value)).toFixed(Number.isInteger(value) ? 0 : 1)}%`;
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-[126px] animate-pulse rounded-[1.5rem] border border-white/10 bg-white/[0.07]"
        />
      ))}
    </div>
  );
}

export default function AdminReportsPage() {
  const reduceMotion = useReducedMotion();
  const [range, setRange] = useState<ReportRange>("month");
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [bookings, setBookings] = useState<BookingReport | null>(null);
  const [popularServices, setPopularServices] = useState<PopularServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchReports = useCallback(async (currentRange: ReportRange, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [revenueResponse, bookingsResponse, servicesResponse] = await Promise.all([
        fetch(`/api/admin/reports/revenue?range=${currentRange}`, {
          cache: "no-store",
        }),
        fetch(`/api/admin/reports/bookings?range=${currentRange}`, {
          cache: "no-store",
        }),
        fetch(`/api/admin/reports/popular-services?range=${currentRange}&limit=6`, {
          cache: "no-store",
        }),
      ]);

      const [revenueJson, bookingsJson, servicesJson] = (await Promise.all([
        revenueResponse.json(),
        bookingsResponse.json(),
        servicesResponse.json(),
      ])) as [
        ApiEnvelope<RevenueReport>,
        ApiEnvelope<BookingReport>,
        ApiEnvelope<{ services: PopularServiceRow[] }>,
      ];

      if (!revenueResponse.ok || !revenueJson.success) {
        throw new Error(revenueJson.error ?? "Revenue report failed.");
      }
      if (!bookingsResponse.ok || !bookingsJson.success) {
        throw new Error(bookingsJson.error ?? "Booking report failed.");
      }
      if (!servicesResponse.ok || !servicesJson.success) {
        throw new Error(servicesJson.error ?? "Service report failed.");
      }

      setRevenue(revenueJson.data ?? null);
      setBookings(bookingsJson.data ?? null);
      setPopularServices(servicesJson.data?.services ?? []);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Reports could not be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchReports(range);
  }, [fetchReports, range]);

  const handleDownloadReport = useCallback(async () => {
    setDownloading(true);
    setErrorMessage(null);
    try {
      const response = await fetch(
        `/api/admin/reports/export?range=${range}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        const json = (await response.json().catch(() => null)) as
          | ApiEnvelope<unknown>
          | null;
        throw new Error(json?.error ?? "Could not generate the report.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
      const filename =
        filenameMatch?.[1] ?? `cleannest-report-${range}.docx`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not generate the report.",
      );
    } finally {
      setDownloading(false);
    }
  }, [range]);

  const breakdown = bookings?.statusBreakdown ?? EMPTY_BREAKDOWN;
  const activePipeline = breakdown.pending + breakdown.confirmed + breakdown.in_progress;
  const cancellationRate =
    bookings && bookings.totalBookings > 0
      ? (breakdown.cancelled / bookings.totalBookings) * 100
      : 0;
  const maximumServiceBookings = Math.max(
    1,
    ...popularServices.map((service) => service.bookingCount)
  );
  const totalServiceRevenue = popularServices.reduce((sum, service) => sum + service.revenue, 0);
  const currentRangeLabel =
    RANGE_OPTIONS.find((option) => option.value === range)?.label ?? "Selected period";

  const donutBackground = useMemo(() => {
    const total = Math.max(1, bookings?.totalBookings ?? 0);
    let cursor = 0;
    const segments = (Object.keys(STATUS_META) as BookingStatus[]).map((status) => {
      const start = cursor;
      cursor += (breakdown[status] / total) * 100;
      return `${STATUS_META[status].dot} ${start}% ${cursor}%`;
    });
    return `conic-gradient(${segments.join(", ")})`;
  }, [bookings?.totalBookings, breakdown]);

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
      <div className="pointer-events-none absolute -right-40 top-24 h-[500px] w-[500px] rounded-full bg-indigo-200/25 blur-3xl" />

      <div className="relative mx-auto max-w-[1450px] space-y-6">
        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-[2.25rem] bg-[linear-gradient(125deg,#071d38_0%,#0b315d_52%,#2749a5_100%)] p-6 text-white shadow-[0_30px_90px_rgba(11,37,69,0.22)] sm:p-8 lg:p-10"
        >
          <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full border border-cyan-200/20 bg-cyan-300/10" />
          <div className="absolute -bottom-48 left-[28%] h-96 w-96 rounded-full bg-indigo-400/25 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col gap-7 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2">
                  <TrendingUp className="h-3.5 w-3.5 text-cyan-300" />
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan-100">
                    Business intelligence
                  </p>
                </div>
                <h1 className="mt-6 max-w-3xl font-heading text-4xl font-black leading-[1.04] tracking-[-0.045em] sm:text-5xl">
                  Performance you can read.
                  <span className="block text-cyan-300">Decisions you can trust.</span>
                </h1>
                <p className="mt-5 max-w-2xl text-sm font-medium leading-7 text-blue-100/70 sm:text-base">
                  Follow revenue, booking health, and service demand through one focused operational
                  view.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div
                  role="tablist"
                  aria-label="Report date range"
                  className="flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.07] p-1.5"
                >
                  {RANGE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="tab"
                      aria-selected={range === option.value}
                      onClick={() => setRange(option.value)}
                      className={`min-h-10 shrink-0 rounded-xl px-3.5 text-xs font-extrabold transition ${
                        range === option.value
                          ? "bg-white text-navy shadow-[0_10px_25px_rgba(0,0,0,0.16)]"
                          : "text-blue-100/65 hover:bg-white/[0.08] hover:text-white"
                      }`}
                    >
                      <span className="sm:hidden">{option.shortLabel}</span>
                      <span className="hidden sm:inline">{option.label}</span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => void fetchReports(range, true)}
                  disabled={refreshing}
                  className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-4 text-xs font-extrabold text-blue-100 transition hover:bg-white/[0.12] disabled:cursor-wait disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 text-cyan-300 ${refreshing ? "animate-spin" : ""}`}
                  />
                  Refresh data
                </button>
                <button
                  type="button"
                  onClick={() => void handleDownloadReport()}
                  disabled={downloading}
                  className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-xl bg-cyan-300 px-4 text-xs font-extrabold text-navy transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60"
                >
                  <Download
                    className={`h-4 w-4 ${downloading ? "animate-bounce" : ""}`}
                  />
                  {downloading ? "Preparing…" : "Download report (.docx)"}
                </button>
              </div>
            </div>

            <div className="mt-9">
              {loading && !revenue && !bookings ? (
                <DashboardSkeleton />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <ExecutiveMetric
                    icon={CircleDollarSign}
                    label="Revenue"
                    value={formatMoney(revenue?.totalRevenue ?? 0, true)}
                    note={`${revenue?.transactionCount ?? 0} paid transactions`}
                    accent="cyan"
                  />
                  <ExecutiveMetric
                    icon={CreditCard}
                    label="Average payment"
                    value={formatMoney(revenue?.averageTransactionValue ?? 0)}
                    note="Per successful transaction"
                    accent="blue"
                  />
                  <ExecutiveMetric
                    icon={ClipboardList}
                    label="Total bookings"
                    value={(bookings?.totalBookings ?? 0).toLocaleString()}
                    note={`${activePipeline} currently active`}
                    accent="violet"
                  />
                  <ExecutiveMetric
                    icon={Target}
                    label="Completion rate"
                    value={percent(bookings?.completionRate ?? 0)}
                    note={`${breakdown.completed} completed services`}
                    accent="emerald"
                  />
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {errorMessage && (
          <div className="flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm font-semibold text-red-600">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {errorMessage}
            </div>
            <button
              type="button"
              onClick={() => void fetchReports(range)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-extrabold text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Retry reports
            </button>
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-[0_20px_60px_rgba(11,37,69,0.08)] sm:p-7">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">
                  Revenue movement
                </p>
                <h2 className="mt-2 font-heading text-2xl font-black tracking-[-0.03em] text-navy">
                  Paid transaction trend
                </h2>
              </div>
              <div className="rounded-2xl bg-primary-light px-4 py-3 text-right">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-primary/60">
                  Selected range
                </p>
                <p className="mt-1 text-xs font-extrabold text-primary">{currentRangeLabel}</p>
              </div>
            </div>
            <div className="mt-5">
              <RevenueTrendChart data={revenue?.series ?? []} loading={loading} />
            </div>
          </div>

          <div className="rounded-[2rem] bg-[linear-gradient(145deg,#0b2545,#154f9e)] p-6 text-white shadow-[0_20px_55px_rgba(11,37,69,0.18)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-cyan-300">
                  Booking health
                </p>
                <h2 className="mt-2 font-heading text-xl font-black">Status distribution</h2>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.08] text-cyan-300">
                <BarChart3 className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-7 flex items-center gap-6">
              <div
                className="relative h-32 w-32 shrink-0 rounded-full"
                style={{ background: donutBackground }}
              >
                <div className="absolute inset-[14px] flex flex-col items-center justify-center rounded-full bg-[#10325a]">
                  <span className="font-heading text-2xl font-black">
                    {bookings?.totalBookings ?? 0}
                  </span>
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-blue-100/50">
                    bookings
                  </span>
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-2.5">
                {(Object.keys(STATUS_META) as BookingStatus[]).map((status) => (
                  <div key={status} className="flex items-center justify-between gap-3 text-xs">
                    <span className="flex items-center gap-2 font-semibold text-blue-100/65">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: STATUS_META[status].dot }}
                      />
                      {STATUS_META[status].label}
                    </span>
                    <span className="font-extrabold text-white">{breakdown[status]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
              <SmallInsight label="Active pipeline" value={String(activePipeline)} />
              <SmallInsight label="Cancellation" value={percent(cancellationRate)} />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_20px_60px_rgba(11,37,69,0.08)]">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-violet-600">
                  Service demand
                </p>
                <h2 className="mt-2 font-heading text-2xl font-black tracking-[-0.03em] text-navy">
                  Top-performing services
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl bg-violet-50 px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-violet-700">
                <Trophy className="h-3.5 w-3.5" />
                Ranked by bookings
              </div>
            </div>

            {loading ? (
              <div className="space-y-3 p-6">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : popularServices.length === 0 ? (
              <div className="flex min-h-[340px] flex-col items-center justify-center p-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-300">
                  <Sparkles className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-heading text-lg font-bold text-navy">
                  No service activity yet
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Service rankings will appear after bookings are created.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {popularServices.map((service, index) => (
                  <ServiceRanking
                    key={service.serviceId}
                    service={service}
                    rank={index + 1}
                    maximumBookings={maximumServiceBookings}
                  />
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_rgba(11,37,69,0.08)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-600">
                    Operations pulse
                  </p>
                  <h2 className="mt-2 font-heading text-xl font-black text-navy">
                    Key observations
                  </h2>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <TrendingUp className="h-5 w-5" />
                </span>
              </div>

              <div className="mt-6 space-y-3">
                <Observation
                  icon={Trophy}
                  title="Demand leader"
                  value={popularServices[0]?.serviceName ?? "No data yet"}
                  tone="violet"
                />
                <Observation
                  icon={CheckCircle2}
                  title="Services completed"
                  value={breakdown.completed.toLocaleString()}
                  tone="emerald"
                />
                <Observation
                  icon={CircleDollarSign}
                  title="Top-service revenue"
                  value={formatMoney(totalServiceRevenue, true)}
                  tone="blue"
                />
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_rgba(11,37,69,0.08)]">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">
                Booking completion
              </p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <p className="font-heading text-4xl font-black tracking-[-0.05em] text-navy">
                  {percent(bookings?.completionRate ?? 0)}
                </p>
                <span className="mb-1 text-xs font-bold text-slate-400">
                  {breakdown.completed} of{" "}
                  {Math.max(0, (bookings?.totalBookings ?? 0) - breakdown.cancelled)}
                </span>
              </div>
              <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  initial={reduceMotion ? false : { width: 0 }}
                  animate={{
                    width: `${Math.min(100, bookings?.completionRate ?? 0)}%`,
                  }}
                  transition={{ duration: 0.65, ease: "easeOut" }}
                  className="h-full rounded-full bg-[linear-gradient(90deg,#10b981,#22d3ee)]"
                />
              </div>
              <p className="mt-4 text-xs font-medium leading-5 text-slate-500">
                Cancelled bookings are excluded from the completion-rate denominator.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function ExecutiveMetric({
  icon: Icon,
  label,
  value,
  note,
  accent,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
  note: string;
  accent: "cyan" | "blue" | "violet" | "emerald";
}) {
  const accents = {
    cyan: "bg-cyan-300 text-navy",
    blue: "bg-blue-300 text-navy",
    violet: "bg-violet-300 text-navy",
    emerald: "bg-emerald-300 text-navy",
  };

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.08] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${accents[accent]}`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-blue-100/55">
          {label}
        </p>
      </div>
      <p className="mt-4 font-heading text-2xl font-black tracking-[-0.04em] text-white">{value}</p>
      <p className="mt-1 text-[10px] font-bold text-blue-100/50">{note}</p>
    </div>
  );
}

function SmallInsight({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.07] p-3">
      <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-blue-100/45">
        {label}
      </p>
      <p className="mt-1.5 font-heading text-lg font-black text-white">{value}</p>
    </div>
  );
}

function ServiceRanking({
  service,
  rank,
  maximumBookings,
}: {
  service: PopularServiceRow;
  rank: number;
  maximumBookings: number;
}) {
  return (
    <div className="group grid gap-4 px-5 py-5 transition hover:bg-violet-50/30 sm:grid-cols-[48px_minmax(0,1fr)_110px_120px] sm:items-center sm:px-7">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black ${
          rank === 1
            ? "bg-violet-600 text-white shadow-[0_10px_24px_rgba(124,58,237,0.2)]"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        {rank === 1 ? <Trophy className="h-4 w-4" /> : `#${rank}`}
      </span>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-heading text-sm font-bold text-navy">
            {service.serviceName}
          </h3>
          <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 transition group-hover:text-violet-500" />
        </div>
        <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
          {service.category}
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#7c3aed,#22d3ee)]"
            style={{
              width: `${(service.bookingCount / maximumBookings) * 100}%`,
            }}
          />
        </div>
      </div>

      <div>
        <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
          Bookings
        </p>
        <p className="mt-1 font-heading text-lg font-black text-navy">{service.bookingCount}</p>
      </div>

      <div>
        <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
          Revenue
        </p>
        <p className="mt-1 font-heading text-lg font-black text-navy">
          {formatMoney(service.revenue, true)}
        </p>
      </div>
    </div>
  );
}

function Observation({
  icon: Icon,
  title,
  value,
  tone,
}: {
  icon: typeof Trophy;
  title: string;
  value: string;
  tone: "violet" | "emerald" | "blue";
}) {
  const tones = {
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
          {title}
        </p>
        <p className="mt-1 truncate text-sm font-bold text-navy">{value}</p>
      </div>
    </div>
  );
}
