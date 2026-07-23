// src/app/(admin)/admin-reports/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  DollarSign,
  Receipt,
  TrendingUp,
  ClipboardList,
  CheckCircle2,
  Sparkles,
  Trophy,
} from "lucide-react";
import RevenueTrendChart from "@/components/reports/RevenueTrendChart";

type ReportRange = "week" | "month" | "year" | "all";

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

type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

interface BookingReport {
  totalBookings: number;
  statusBreakdown: Record<BookingStatus, number>;
  completionRate: number;
}

interface PopularServiceRow {
  serviceId: string;
  serviceName: string;
  category: string;
  bookingCount: number;
  revenue: number;
}

const RANGE_OPTIONS: { value: ReportRange; label: string }[] = [
  { value: "week", label: "7 Days" },
  { value: "month", label: "30 Days" },
  { value: "year", label: "12 Months" },
  { value: "all", label: "All Time" },
];

const STATUS_META: Record<
  BookingStatus,
  { label: string; badgeClass: string; icon: typeof ClipboardList }
> = {
  pending: {
    label: "Pending",
    badgeClass: "bg-status-pending/10 text-status-pending",
    icon: ClipboardList,
  },
  confirmed: {
    label: "Confirmed",
    badgeClass: "bg-status-confirmed/10 text-status-confirmed",
    icon: CheckCircle2,
  },
  in_progress: {
    label: "In Progress",
    badgeClass: "bg-status-inProgress/10 text-status-inProgress",
    icon: TrendingUp,
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-status-confirmed/10 text-status-confirmed",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "bg-status-cancelled/10 text-status-cancelled",
    icon: ClipboardList,
  },
};

export default function AdminReportsPage() {
  const [range, setRange] = useState<ReportRange>("month");

  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(true);

  const [bookings, setBookings] = useState<BookingReport | null>(null);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  const [popularServices, setPopularServices] = useState<PopularServiceRow[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchRevenue = useCallback(async (r: ReportRange) => {
    setRevenueLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/revenue?range=${r}`);
      const json: ApiEnvelope<RevenueReport> = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to load revenue");
      setRevenue(json.data ?? null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to load revenue");
    } finally {
      setRevenueLoading(false);
    }
  }, []);

  const fetchBookings = useCallback(async (r: ReportRange) => {
    setBookingsLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/bookings?range=${r}`);
      const json: ApiEnvelope<BookingReport> = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to load bookings");
      setBookings(json.data ?? null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  const fetchPopularServices = useCallback(async (r: ReportRange) => {
    setServicesLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/popular-services?range=${r}&limit=5`);
      const json: ApiEnvelope<{ services: PopularServiceRow[] }> = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to load services");
      setPopularServices(json.data?.services ?? []);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to load services");
    } finally {
      setServicesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRevenue(range);
    fetchBookings(range);
    fetchPopularServices(range);
  }, [range, fetchRevenue, fetchBookings, fetchPopularServices]);

  const maxPopularCount = Math.max(1, ...popularServices.map((s) => s.bookingCount));

  return (
    <div className="min-h-screen bg-surface p-6 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_6px_16px_rgba(30,111,217,0.35)]">
            <BarChart3 size={21} strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-navy">
              Reports
            </h1>
            <p className="mt-0.5 text-sm text-navy/55">
              Revenue, booking activity, and service performance at a glance.
            </p>
          </div>

          <div className="ml-auto flex gap-1 rounded-full border border-navy/[0.06] bg-surface-soft p-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRange(opt.value)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  range === opt.value
                    ? "bg-primary text-white shadow-sm"
                    : "text-navy/60 hover:text-navy"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-card border border-status-cancelled/20 bg-status-cancelled/5 px-4 py-3 text-sm font-medium text-status-cancelled">
            {errorMessage}
          </div>
        )}

        {/* Revenue section */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-navy">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-light text-primary">
              <DollarSign size={15} />
            </span>
            Revenue
          </h2>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-4 rounded-card border border-navy/[0.06] bg-surface p-5 shadow-card lg:col-span-1">
              <div>
                <p className="text-xs font-medium text-navy/45">Total Revenue</p>
                {revenueLoading ? (
                  <div className="mt-1.5 h-7 w-24 animate-pulse rounded bg-navy/[0.06]" />
                ) : (
                  <p className="mt-1 font-heading text-2xl font-bold text-navy">
                    ${revenue?.totalRevenue.toLocaleString() ?? 0}
                  </p>
                )}
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs font-medium text-navy/45">
                  <Receipt size={12} /> Transactions
                </p>
                {revenueLoading ? (
                  <div className="mt-1.5 h-6 w-16 animate-pulse rounded bg-navy/[0.06]" />
                ) : (
                  <p className="mt-1 font-heading text-lg font-semibold text-navy">
                    {revenue?.transactionCount ?? 0}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-navy/45">Average Value</p>
                {revenueLoading ? (
                  <div className="mt-1.5 h-6 w-16 animate-pulse rounded bg-navy/[0.06]" />
                ) : (
                  <p className="mt-1 font-heading text-lg font-semibold text-navy">
                    ${revenue?.averageTransactionValue.toLocaleString() ?? 0}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-card border border-navy/[0.06] bg-surface p-5 shadow-card lg:col-span-2">
              <RevenueTrendChart
                data={revenue?.series ?? []}
                loading={revenueLoading}
              />
            </div>
          </div>
        </section>

        {/* Bookings section */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-navy">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-light text-primary">
              <ClipboardList size={15} />
            </span>
            Bookings
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {(Object.keys(STATUS_META) as BookingStatus[]).map((status) => {
              const meta = STATUS_META[status];
              const Icon = meta.icon;
              return (
                <div
                  key={status}
                  className="rounded-card border border-navy/[0.06] bg-surface p-4 shadow-card"
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${meta.badgeClass}`}
                  >
                    <Icon size={15} />
                  </span>
                  <p className="mt-2 text-xs font-medium text-navy/45">
                    {meta.label}
                  </p>
                  {bookingsLoading ? (
                    <div className="mt-1 h-6 w-10 animate-pulse rounded bg-navy/[0.06]" />
                  ) : (
                    <p className="font-heading text-xl font-bold text-navy">
                      {bookings?.statusBreakdown[status] ?? 0}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="rounded-card border border-navy/[0.06] bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-navy/45">Completion Rate</p>
                {bookingsLoading ? (
                  <div className="mt-1.5 h-7 w-16 animate-pulse rounded bg-navy/[0.06]" />
                ) : (
                  <p className="mt-1 font-heading text-2xl font-bold text-navy">
                    {bookings?.completionRate ?? 0}%
                  </p>
                )}
              </div>
              <p className="text-sm text-navy/50">
                {bookingsLoading ? "" : `${bookings?.totalBookings ?? 0} total bookings`}
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-navy/[0.06]">
              <div
                className="h-full rounded-full bg-status-confirmed transition-all"
                style={{ width: `${bookings?.completionRate ?? 0}%` }}
              />
            </div>
          </div>
        </section>

        {/* Popular services section */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-navy">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-light text-primary">
              <Sparkles size={15} />
            </span>
            Popular Services
          </h2>

          <div className="overflow-hidden rounded-card border border-navy/[0.06] bg-surface shadow-card">
            {servicesLoading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded-lg bg-navy/[0.04]"
                  />
                ))}
              </div>
            ) : popularServices.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-navy/40">
                <Sparkles size={24} className="text-navy/20" />
                <span className="text-sm font-medium">
                  No bookings in this period yet
                </span>
              </div>
            ) : (
              <ul className="divide-y divide-navy/[0.05]">
                {popularServices.map((service, i) => (
                  <li
                    key={service.serviceId}
                    className="flex items-center gap-4 px-6 py-3.5"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        i === 0
                          ? "bg-primary text-white"
                          : "bg-surface-soft text-navy/50"
                      }`}
                    >
                      {i === 0 ? <Trophy size={14} /> : `#${i + 1}`}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-navy">
                        {service.serviceName}
                      </p>
                      <p className="text-xs text-navy/45">{service.category}</p>
                    </div>

                    <div className="w-32 shrink-0">
                      <div className="h-1.5 overflow-hidden rounded-full bg-navy/[0.06]">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${
                              (service.bookingCount / maxPopularCount) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="w-20 shrink-0 text-right">
                      <p className="text-sm font-semibold text-navy">
                        {service.bookingCount}
                      </p>
                      <p className="text-[11px] text-navy/40">bookings</p>
                    </div>

                    <div className="w-24 shrink-0 text-right">
                      <p className="text-sm font-semibold text-navy">
                        ${service.revenue.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-navy/40">revenue</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
