"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  DollarSign,
  ListChecks,
  MapPin,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WandSparkles,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";

import { useCustomerDashboard, type DashboardBooking } from "@/hooks/useCustomerDashboard";
import { Alert } from "@/components/ui/Alert";
import StatCard from "@/components/dashboard/StatCard";
import { UpcomingBookings } from "@/components/dashboard/UpcomingBookings";
import { BookingHistory } from "@/components/dashboard/BookingHistory";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function getServiceName(booking?: DashboardBooking) {
  if (!booking?.serviceId || typeof booking.serviceId === "string") {
    return "Cleaning service";
  }

  return booking.serviceId.name ?? "Cleaning service";
}

function getAddressLabel(booking?: DashboardBooking) {
  if (!booking?.addressId || typeof booking.addressId === "string") {
    return "Address ready after confirmation";
  }

  return [booking.addressId.label, booking.addressId.area, booking.addressId.city]
    .filter(Boolean)
    .join(", ");
}

function formatVisitDate(value?: string) {
  if (!value) {
    return "Schedule pending";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Beirut",
  }).format(date);
}

function DashboardContent() {
  const {
    stats,
    statsLoading,
    upcoming,
    upcomingLoading,
    history,
    historyLoading,
    statsError,
    setStatsError,
    upcomingError,
    setUpcomingError,
    historyError,
    setHistoryError,
    fetchOverview,
    fetchHistory,
  } = useCustomerDashboard();

  const [historyPage, setHistoryPage] = useState(1);
  const [historyStatus, setHistoryStatus] = useState("");
  const initialLoadStarted = useRef(false);

  useEffect(() => {
    if (initialLoadStarted.current) {
      return;
    }

    initialLoadStarted.current = true;
    void fetchOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!history) {
      return;
    }

    fetchHistory(historyPage, 10, historyStatus || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyPage, historyStatus]);

  function handleStatusChange(status: string) {
    setHistoryStatus(status);
    setHistoryPage(1);
  }

  const nextBooking = upcoming[0];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f7fc] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "linear-gradient(rgba(30,111,217,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.045) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-[1450px] space-y-6">
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-[2.25rem] bg-[linear-gradient(125deg,#071d38_0%,#0b315d_52%,#1675cf_100%)] p-6 text-white shadow-[0_30px_90px_rgba(11,37,69,0.24)] sm:p-8 lg:p-10"
        >
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-32 h-80 w-80 rounded-full border border-cyan-200/20 bg-cyan-300/10"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-44 left-[30%] h-96 w-96 rounded-full bg-primary/20 blur-3xl"
          />

          <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_440px]">
            <div className="flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-40" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  </span>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan-100">
                    Your CleanNest command center
                  </p>
                </div>

                <h1 className="mt-6 max-w-3xl font-heading text-4xl font-black leading-[1.03] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                  Welcome back.
                  <span className="block text-cyan-300">Your home is on track.</span>
                </h1>

                <p className="mt-5 max-w-2xl text-sm font-medium leading-7 text-blue-100/70 sm:text-base">
                  See what is coming next, review your cleaning history, and build a new
                  service route from one calm, organized space.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/book-service"
                  className="group inline-flex min-h-[52px] items-center gap-3 rounded-2xl bg-white px-6 text-sm font-extrabold text-navy shadow-[0_16px_35px_rgba(0,0,0,0.18)] transition hover:bg-cyan-50"
                >
                  <WandSparkles className="h-4 w-4 text-primary" />
                  Book a cleaning
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/bookings"
                  className="inline-flex min-h-[52px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-5 text-xs font-extrabold text-blue-100 transition hover:bg-white/[0.12]"
                >
                  <ListChecks className="h-4 w-4 text-cyan-300" />
                  View all bookings
                </Link>
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-white/15 bg-white/[0.09] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] sm:p-6">
              {upcomingLoading ? (
                <div className="flex min-h-[300px] flex-col justify-center">
                  <div className="h-4 w-28 animate-pulse rounded-full bg-white/10" />
                  <div className="mt-6 h-14 w-4/5 animate-pulse rounded-2xl bg-white/10" />
                  <div className="mt-5 h-24 animate-pulse rounded-2xl bg-white/10" />
                </div>
              ) : nextBooking ? (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-cyan-300">
                        Next home visit
                      </p>
                      <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-blue-100/50">
                        {nextBooking.bookingNumber}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.1em] text-emerald-200">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Scheduled
                    </span>
                  </div>

                  <div className="mt-6 flex items-start gap-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-300 text-navy shadow-[0_12px_30px_rgba(34,211,238,0.24)]">
                      <CalendarCheck2 className="h-6 w-6" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate font-heading text-2xl font-black">
                        {getServiceName(nextBooking)}
                      </h2>
                      <p className="mt-2 text-sm font-semibold text-blue-100/65">
                        {formatVisitDate(nextBooking.bookingDate)}
                      </p>
                      <p className="mt-1 text-sm font-bold text-cyan-200">
                        {nextBooking.startTime} – {nextBooking.endTime}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-navy/25 p-4">
                      <Clock3 className="h-4 w-4 text-cyan-300" />
                      <p className="mt-3 text-[9px] font-extrabold uppercase tracking-[0.12em] text-blue-100/45">
                        Arrival
                      </p>
                      <p className="mt-1 text-sm font-black">{nextBooking.startTime}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-navy/25 p-4">
                      <DollarSign className="h-4 w-4 text-emerald-300" />
                      <p className="mt-3 text-[9px] font-extrabold uppercase tracking-[0.12em] text-blue-100/45">
                        Total
                      </p>
                      <p className="mt-1 text-sm font-black">
                        {formatCurrency(nextBooking.totalAmount)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 flex items-start gap-2 text-sm font-medium leading-6 text-blue-100/65">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <span className="line-clamp-2">{getAddressLabel(nextBooking)}</span>
                  </p>
                </>
              ) : (
                <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-cyan-300">
                    <Sparkles className="h-7 w-7" />
                  </span>
                  <h2 className="mt-5 font-heading text-2xl font-black">
                    Ready for your next clean?
                  </h2>
                  <p className="mt-3 max-w-xs text-sm leading-6 text-blue-100/60">
                    Your next scheduled visit will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {(statsError || upcomingError || historyError) && (
          <div className="space-y-3">
            {statsError && (
              <DashboardError
                label="Statistics"
                message={statsError}
                onDismiss={() => setStatsError(null)}
              />
            )}
            {upcomingError && (
              <DashboardError
                label="Upcoming bookings"
                message={upcomingError}
                onDismiss={() => setUpcomingError(null)}
              />
            )}
            {historyError && (
              <DashboardError
                label="Booking history"
                message={historyError}
                onDismiss={() => setHistoryError(null)}
              />
            )}
          </div>
        )}

        <section>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">
                Activity pulse
              </p>
              <h2 className="mt-2 font-heading text-2xl font-black tracking-[-0.03em] text-navy">
                Your cleaning snapshot
              </h2>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/10 bg-white px-3 py-2 text-[10px] font-extrabold text-slate-500">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              Updated live
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="Upcoming"
              value={stats?.upcomingBookings ?? 0}
              icon={CalendarClock}
              accent="inProgress"
              loading={statsLoading}
            />
            <StatCard
              label="Completed"
              value={stats?.completedBookings ?? 0}
              icon={CheckCircle2}
              accent="confirmed"
              loading={statsLoading}
            />
            <StatCard
              label="Cancelled"
              value={stats?.cancelledBookings ?? 0}
              icon={XCircle}
              accent="cancelled"
              loading={statsLoading}
            />
            <StatCard
              label="Total bookings"
              value={stats?.totalBookings ?? 0}
              icon={ListChecks}
              accent="primary"
              loading={statsLoading}
            />
            <StatCard
              label="Completed spend"
              value={stats ? formatCurrency(stats.totalSpent) : "—"}
              icon={DollarSign}
              accent="pending"
              loading={statsLoading}
            />
          </div>
        </section>

        <UpcomingBookings bookings={upcoming} loading={upcomingLoading} />

        <BookingHistory
          bookings={history?.bookings ?? []}
          total={history?.total ?? 0}
          page={history?.page ?? historyPage}
          limit={history?.limit ?? 10}
          status={historyStatus}
          onStatusChange={handleStatusChange}
          onPageChange={setHistoryPage}
          loading={historyLoading}
        />
      </div>
    </main>
  );
}

function DashboardError({
  label,
  message,
  onDismiss,
}: {
  label: string;
  message: string;
  onDismiss: () => void;
}) {
  return (
    <Alert variant="error">
      <div className="flex items-center justify-between gap-3">
        <span>
          {label}: {message}
        </span>
        <button type="button" onClick={onDismiss} className="font-semibold">
          Dismiss
        </button>
      </div>
    </Alert>
  );
}

export default function CustomerDashboardPage() {
  return <DashboardContent />;
}
