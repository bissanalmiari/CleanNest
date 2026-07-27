"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";

import Link from "next/link";

import {
  AlertCircle,
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CreditCard,
  LoaderCircle,
  MapPin,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TimerReset,
  UserRound,
  WandSparkles,
  XCircle,
} from "lucide-react";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import ServiceProofReportPanel from "@/components/proof/ServiceProofReportPanel";

type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";

type BookingFilter = "all" | "active" | "completed" | "cancelled";

interface BookingApiItem {
  id?: string;
  _id?: string;

  bookingNumber?: string;
  status?: string;

  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  estimatedDurationMinutes?: number;

  totalAmount?: number;

  assignedCleanerName?: string | null;

  paymentMethod?: string;
  paymentStatus?: string;

  serviceName?: string;

  service?: {
    name?: string;
  } | null;

  addressLabel?: string;

  address?: {
    label?: string;
    city?: string;
    area?: string;
    street?: string;
  } | null;

  review?: {
    id?: string;
    rating?: number;
  } | null;
  canReview?: boolean;
}

interface BookingRecord {
  id: string;
  bookingNumber: string;
  status: BookingStatus;

  bookingDate: string;
  startTime: string;
  endTime: string;
  estimatedDurationMinutes: number;

  totalAmount: number;

  serviceName: string;
  addressLabel: string;

  assignedCleanerName: string | null;

  paymentMethod: string;
  paymentStatus: string;
  reviewId: string | null;
  reviewRating: number | null;
  canReview: boolean;
}

interface StatusDesign {
  label: string;
  icon: ComponentType<{
    className?: string;
  }>;
  badgeClassName: string;
  iconClassName: string;
  routeClassName: string;
}

const STATUS_DESIGNS: Record<BookingStatus, StatusDesign> = {
  pending: {
    label: "Pending",
    icon: Clock3,
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    iconClassName: "bg-amber-100 text-amber-600",
    routeClassName: "from-amber-400 to-orange-400",
  },

  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    badgeClassName: "border-blue-200 bg-blue-50 text-primary",
    iconClassName: "bg-primary-light text-primary",
    routeClassName: "from-primary to-cyan-400",
  },

  in_progress: {
    label: "In progress",
    icon: Sparkles,
    badgeClassName: "border-cyan-200 bg-cyan-50 text-cyan-700",
    iconClassName: "bg-cyan-100 text-cyan-700",
    routeClassName: "from-cyan-400 to-emerald-400",
  },

  completed: {
    label: "Completed",
    icon: CheckCircle2,
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    iconClassName: "bg-emerald-100 text-emerald-700",
    routeClassName: "from-emerald-400 to-emerald-600",
  },

  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    badgeClassName: "border-red-200 bg-red-50 text-red-700",
    iconClassName: "bg-red-100 text-red-600",
    routeClassName: "from-red-300 to-red-500",
  },
};

const FILTERS: Array<{
  id: BookingFilter;
  label: string;
}> = [
  {
    id: "all",
    label: "All routes",
  },
  {
    id: "active",
    label: "Active",
  },
  {
    id: "completed",
    label: "Completed",
  },
  {
    id: "cancelled",
    label: "Cancelled",
  },
];

function normalizeStatus(status?: string): BookingStatus {
  switch (status) {
    case "confirmed":
    case "in_progress":
    case "completed":
    case "cancelled":
    case "pending":
      return status;

    default:
      return "pending";
  }
}

function extractBookingArray(payload: unknown): BookingApiItem[] {
  if (typeof payload !== "object" || payload === null) {
    return [];
  }

  const response = payload as {
    bookings?: unknown;
    data?: unknown;
  };

  if (Array.isArray(response.bookings)) {
    return response.bookings as BookingApiItem[];
  }

  if (Array.isArray(response.data)) {
    return response.data as BookingApiItem[];
  }

  if (typeof response.data === "object" && response.data !== null) {
    const data = response.data as {
      bookings?: unknown;
      items?: unknown;
      results?: unknown;
    };

    if (Array.isArray(data.bookings)) {
      return data.bookings as BookingApiItem[];
    }

    if (Array.isArray(data.items)) {
      return data.items as BookingApiItem[];
    }

    if (Array.isArray(data.results)) {
      return data.results as BookingApiItem[];
    }
  }

  return [];
}

function normalizeBooking(booking: BookingApiItem, index: number): BookingRecord {
  const addressParts = [
    booking.address?.label,
    booking.address?.area,
    booking.address?.city,
  ].filter(Boolean);

  return {
    id: booking.id ?? booking._id ?? `booking-${index}`,

    bookingNumber: booking.bookingNumber ?? `CN-ROUTE-${index + 1}`,

    status: normalizeStatus(booking.status),

    bookingDate: booking.bookingDate ?? "",

    startTime: booking.startTime ?? "",

    endTime: booking.endTime ?? "",

    estimatedDurationMinutes: Number(booking.estimatedDurationMinutes) || 0,

    totalAmount: Number(booking.totalAmount) || 0,

    serviceName: booking.service?.name ?? booking.serviceName ?? "Cleaning service",

    addressLabel: addressParts.join(" · ") || booking.addressLabel || "Address unavailable",

    assignedCleanerName: booking.assignedCleanerName ?? null,

    paymentMethod: booking.paymentMethod ?? "cash",

    paymentStatus: booking.paymentStatus ?? "unpaid",

    reviewId: booking.review?.id ?? null,
    reviewRating: typeof booking.review?.rating === "number" ? booking.review.rating : null,
    canReview: booking.canReview === true,
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatBookingDate(value: string) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Beirut",
  }).format(date);
}

function formatDuration(minutes: number) {
  if (minutes <= 0) {
    return "Not calculated";
  }

  const hours = Math.floor(minutes / 60);

  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

function paymentMethodLabel(value: string) {
  return value === "card" ? "Test card" : "Cash after service";
}

function matchesFilter(booking: BookingRecord, filter: BookingFilter) {
  if (filter === "all") {
    return true;
  }

  if (filter === "active") {
    return ["pending", "confirmed", "in_progress"].includes(booking.status);
  }

  return booking.status === filter;
}

function getStatusProgress(status: BookingStatus): number {
  switch (status) {
    case "pending":
      return 25;
    case "confirmed":
      return 55;
    case "in_progress":
      return 82;
    case "completed":
      return 100;
    case "cancelled":
      return 100;
  }
}

function getVisitCountdown(value: string): string {
  const visitDate = new Date(value);

  if (Number.isNaN(visitDate.getTime())) {
    return "Date pending";
  }

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfVisit = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate());
  const days = Math.round(
    (startOfVisit.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (days === 0) {
    return "Today";
  }

  if (days === 1) {
    return "Tomorrow";
  }

  if (days > 1) {
    return `In ${days} days`;
  }

  return "Visit passed";
}

export default function MyBookingsPage() {
  const prefersReducedMotion = useReducedMotion();

  const [bookings, setBookings] = useState<BookingRecord[]>([]);

  const [selectedFilter, setSelectedFilter] = useState<BookingFilter>("all");

  const [searchQuery, setSearchQuery] = useState("");

  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const initialLoadStarted = useRef(false);

  async function loadBookings() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/customer/bookings", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const payload: unknown = await response.json();

      if (!response.ok) {
        const errorPayload = payload as {
          message?: string;
          error?: string;
        };

        throw new Error(
          errorPayload.message ?? errorPayload.error ?? "Unable to load your bookings."
        );
      }

      const rawBookings = extractBookingArray(payload);

      const normalizedBookings = rawBookings.map(normalizeBooking).sort((first, second) => {
        const firstDate = new Date(first.bookingDate).getTime();

        const secondDate = new Date(second.bookingDate).getTime();

        return secondDate - firstDate;
      });

      setBookings(normalizedBookings);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load your bookings.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (initialLoadStarted.current) {
      return;
    }

    initialLoadStarted.current = true;
    void loadBookings();
  }, []);

  const bookingCounts = useMemo(() => {
    return {
      all: bookings.length,

      active: bookings.filter((booking) =>
        ["pending", "confirmed", "in_progress"].includes(booking.status)
      ).length,

      completed: bookings.filter((booking) => booking.status === "completed").length,

      cancelled: bookings.filter((booking) => booking.status === "cancelled").length,
    };
  }, [bookings]);

  const nextBooking = useMemo(() => {
    const activeBookings = bookings
      .filter((booking) => ["pending", "confirmed", "in_progress"].includes(booking.status))
      .sort(
        (first, second) =>
          new Date(first.bookingDate).getTime() - new Date(second.bookingDate).getTime()
      );

    return (
      activeBookings.find(
        (booking) => new Date(booking.bookingDate).getTime() >= Date.now() - 86400000
      ) ??
      activeBookings[0] ??
      null
    );
  }, [bookings]);

  const completedSpend = useMemo(
    () =>
      bookings
        .filter((booking) => booking.status === "completed")
        .reduce((total, booking) => total + booking.totalAmount, 0),
    [bookings]
  );

  const filteredBookings = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return bookings.filter((booking) => {
      if (!matchesFilter(booking, selectedFilter)) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        booking.bookingNumber,
        booking.serviceName,
        booking.addressLabel,
        booking.assignedCleanerName ?? "",
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [bookings, searchQuery, selectedFilter]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f7fc] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(30,111,217,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.045) 1px, transparent 1px)",
          backgroundSize: "46px 46px",
        }}
      />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-44 top-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
        animate={
          prefersReducedMotion
            ? undefined
            : {
                scale: [1, 1.18, 1],
                y: [0, 30, 0],
              }
        }
        transition={{
          duration: 9,
          repeat: 0,
          ease: "easeInOut",
        }}
      />

      <div className="relative mx-auto max-w-[1450px]">
        {/* Booking command hero */}
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-[2.25rem] bg-[linear-gradient(125deg,#071d38_0%,#0b315d_52%,#1675cf_100%)] p-6 text-white shadow-[0_30px_90px_rgba(11,37,69,0.24)] sm:p-8 lg:p-10"
        >
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-36 h-80 w-80 rounded-full border border-cyan-200/20 bg-cyan-300/10"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-[-11rem] left-[34%] h-80 w-80 rounded-full bg-primary/25 blur-3xl"
          />

          <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_430px] xl:items-stretch">
            <div className="flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-40" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  </span>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan-100">
                    Personal cleaning command center
                  </p>
                </div>

                <h1 className="mt-6 max-w-3xl font-heading text-4xl font-black leading-[1.03] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                  Every clean.
                  <span className="block text-cyan-300">One clear timeline.</span>
                </h1>

                <p className="mt-5 max-w-2xl text-sm font-medium leading-7 text-blue-100/70 sm:text-base">
                  Follow upcoming visits, cleaner assignments, payments, and finished services
                  without losing track of a single detail.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/book-service"
                  className="group inline-flex min-h-[52px] items-center justify-center gap-3 rounded-2xl bg-white px-6 text-sm font-extrabold text-navy shadow-[0_16px_35px_rgba(0,0,0,0.18)] transition hover:bg-cyan-50"
                >
                  <WandSparkles className="h-4 w-4 text-primary" />
                  Book another clean
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <span className="inline-flex min-h-[52px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-5 text-xs font-bold text-blue-100">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  All routes secured
                </span>
              </div>
            </div>

            <div className="relative rounded-[1.8rem] border border-white/15 bg-white/[0.09] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] sm:p-6">
              {nextBooking ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-cyan-300">
                        Next visit
                      </p>
                      <p className="mt-2 text-sm font-bold text-white">
                        {getVisitCountdown(nextBooking.bookingDate)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] ${STATUS_DESIGNS[nextBooking.status].badgeClassName}`}
                    >
                      {STATUS_DESIGNS[nextBooking.status].label}
                    </span>
                  </div>

                  <div className="mt-6 flex items-start gap-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-300 text-navy shadow-[0_12px_30px_rgba(34,211,238,0.24)]">
                      <CalendarCheck2 className="h-6 w-6" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate font-heading text-2xl font-black">
                        {nextBooking.serviceName}
                      </h2>
                      <p className="mt-2 text-sm font-semibold text-blue-100/65">
                        {formatBookingDate(nextBooking.bookingDate)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-cyan-200">
                        {nextBooking.startTime || "Time pending"}
                        {nextBooking.endTime ? ` – ${nextBooking.endTime}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-navy/25 p-4">
                    <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-[0.12em]">
                      <span className="text-blue-100/55">Booking progress</span>
                      <span className="text-cyan-300">
                        {getStatusProgress(nextBooking.status)}%
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${getStatusProgress(nextBooking.status)}%` }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300"
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex items-start gap-3 text-sm font-medium leading-6 text-blue-100/65">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <span className="line-clamp-2">{nextBooking.addressLabel}</span>
                  </div>
                </>
              ) : (
                <div className="flex min-h-[290px] flex-col items-center justify-center text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-cyan-300">
                    <CalendarDays className="h-7 w-7" />
                  </span>
                  <h2 className="mt-5 font-heading text-2xl font-black">Your calendar is clear</h2>
                  <p className="mt-3 max-w-xs text-sm leading-6 text-blue-100/60">
                    Book a cleaning and your next visit will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.header>

        {/* Summary cards */}
        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <RouteMetric
            label="All routes"
            value={bookingCounts.all}
            icon={ReceiptText}
            description="Complete booking archive"
            tone="blue"
          />

          <RouteMetric
            label="Active routes"
            value={bookingCounts.active}
            icon={CalendarDays}
            description="Pending or scheduled"
            tone="cyan"
          />

          <RouteMetric
            label="Completed"
            value={bookingCounts.completed}
            icon={CheckCircle2}
            description="Successfully finished"
            tone="emerald"
          />

          <RouteMetric
            label="Completed spend"
            value={formatCurrency(completedSpend)}
            icon={CircleDollarSign}
            description={`${bookingCounts.cancelled} cancelled route${bookingCounts.cancelled === 1 ? "" : "s"}`}
            tone="amber"
          />
        </section>

        {/* Search and filters */}
        <section className="mt-6 rounded-[1.7rem] border border-white/80 bg-white/80 p-4 shadow-[0_18px_55px_rgba(11,37,69,0.08)] backdrop-blur-md sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                }}
                placeholder="Search route, service, address, or cleaner"
                className="min-h-12 w-full rounded-2xl border border-primary/10 bg-surface-soft pl-11 pr-4 text-sm font-semibold text-navy outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-primary/35 focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {FILTERS.map((filter) => {
                const isSelected = selectedFilter === filter.id;

                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => {
                      setSelectedFilter(filter.id);
                    }}
                    className={`shrink-0 rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
                      isSelected
                        ? "border-navy bg-navy text-white shadow-md"
                        : "border-primary/10 bg-white text-slate-500 hover:border-primary/25 hover:text-primary"
                    }`}
                  >
                    {filter.label}

                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-[9px] ${
                        isSelected ? "bg-white/10 text-cyan-200" : "bg-primary-light text-primary"
                      }`}
                    >
                      {bookingCounts[filter.id]}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  void loadBookings();
                }}
                disabled={isLoading}
                className="flex shrink-0 items-center gap-2 rounded-xl border border-primary/10 bg-white px-4 py-2.5 text-xs font-bold text-slate-500 transition hover:border-primary/25 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </section>

        {/* Loading */}
        {isLoading && (
          <div className="mt-6 flex min-h-[360px] items-center justify-center rounded-[2rem] border border-white/80 bg-white/70 shadow-card">
            <div className="text-center">
              <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-primary" />

              <p className="mt-4 text-sm font-bold text-navy">Loading your cleaning routes</p>

              <p className="mt-2 text-xs text-slate-400">
                Connecting to the CleanNest booking archive.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {!isLoading && errorMessage && (
          <div className="mt-6 rounded-[2rem] border border-red-200 bg-red-50 p-8 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500" />

            <h2 className="mt-4 font-heading text-xl font-bold text-red-800">
              We could not load your routes
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-red-600">{errorMessage}</p>

            <button
              type="button"
              onClick={() => {
                void loadBookings();
              }}
              className="mt-5 rounded-xl bg-red-600 px-5 py-3 text-xs font-bold text-white"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !errorMessage && filteredBookings.length === 0 && (
          <div className="mt-6 overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 shadow-[0_25px_70px_rgba(11,37,69,0.09)]">
            <div className="grid min-h-[400px] items-center gap-8 p-8 lg:grid-cols-2 lg:p-12">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">
                  Route archive empty
                </p>

                <h2 className="mt-4 max-w-lg font-heading text-3xl font-black tracking-[-0.035em] text-navy">
                  No cleaning routes match this view.
                </h2>

                <p className="mt-4 max-w-lg text-sm leading-7 text-slate-500">
                  Create a new CleanNest route or change the current search and filter options.
                </p>

                <Link
                  href="/book-service"
                  className="mt-6 inline-flex min-h-12 items-center gap-3 rounded-xl bg-navy px-6 text-sm font-bold text-white"
                >
                  <Sparkles className="h-4 w-4 text-cyan-300" />
                  Start a cleaning route
                </Link>
              </div>

              <div className="relative mx-auto grid aspect-square w-full max-w-sm grid-cols-2 gap-3 rounded-[2rem] border border-primary/10 bg-primary-light/40 p-4">
                {["Space", "Plan", "Address", "Time"].map((routePoint, index) => (
                  <motion.div
                    key={routePoint}
                    animate={
                      prefersReducedMotion
                        ? undefined
                        : {
                            y: [0, index % 2 === 0 ? -5 : 5, 0],
                          }
                    }
                    transition={{
                      duration: 3 + index,
                      repeat: 0,
                      ease: "easeInOut",
                    }}
                    className="flex flex-col justify-between rounded-2xl border border-white bg-white/80 p-4"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
                      <Sparkles className="h-4 w-4" />
                    </span>

                    <p className="text-xs font-bold text-navy">{routePoint}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Booking routes */}
        {!isLoading && !errorMessage && filteredBookings.length > 0 && (
          <section className="mt-6 space-y-4">
            <AnimatePresence initial={false}>
              {filteredBookings.map((booking, index) => (
                <BookingRouteCard
                  key={booking.id}
                  booking={booking}
                  index={index}
                  expanded={expandedBookingId === booking.id}
                  onToggle={() => {
                    setExpandedBookingId((currentBookingId) =>
                      currentBookingId === booking.id ? null : booking.id
                    );
                  }}
                />
              ))}
            </AnimatePresence>
          </section>
        )}
      </div>
    </main>
  );
}

interface RouteMetricProps {
  label: string;
  value: number | string;
  description: string;
  tone: "blue" | "cyan" | "emerald" | "amber";
  icon: ComponentType<{
    className?: string;
  }>;
}

function RouteMetric({ label, value, description, tone, icon: Icon }: RouteMetricProps) {
  const toneClasses = {
    blue: {
      icon: "bg-blue-50 text-primary",
      glow: "bg-primary/10",
      line: "from-primary to-blue-400",
    },
    cyan: {
      icon: "bg-cyan-50 text-cyan-700",
      glow: "bg-cyan-300/15",
      line: "from-cyan-400 to-primary",
    },
    emerald: {
      icon: "bg-emerald-50 text-emerald-700",
      glow: "bg-emerald-300/15",
      line: "from-emerald-400 to-cyan-400",
    },
    amber: {
      icon: "bg-amber-50 text-amber-700",
      glow: "bg-amber-300/15",
      line: "from-amber-400 to-orange-400",
    },
  }[tone];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="group relative overflow-hidden rounded-[1.6rem] border border-white bg-white/90 p-5 shadow-[0_15px_45px_rgba(11,37,69,0.07)] transition hover:border-primary/15 hover:shadow-[0_22px_55px_rgba(11,37,69,0.11)]"
    >
      <div
        aria-hidden="true"
        className={`absolute -right-10 -top-12 h-32 w-32 rounded-full transition-transform duration-500 group-hover:scale-110 ${toneClasses.glow}`}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-primary">
            {label}
          </p>

          <p className="mt-2 font-heading text-3xl font-black tracking-[-0.035em] text-navy">
            {value}
          </p>

          <p className="mt-2 text-[11px] text-slate-400">{description}</p>
        </div>

        <span
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClasses.icon}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${toneClasses.line}`} />
    </motion.div>
  );
}

interface BookingRouteCardProps {
  booking: BookingRecord;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}

function BookingRouteCard({ booking, index, expanded, onToggle }: BookingRouteCardProps) {
  const statusDesign = STATUS_DESIGNS[booking.status];

  const StatusIcon = statusDesign.icon;

  return (
    <motion.article
      layout
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.05, 0.3),
      }}
      className="group/card relative overflow-hidden rounded-[1.9rem] border border-white bg-white/95 shadow-[0_18px_55px_rgba(11,37,69,0.08)] transition hover:border-primary/15 hover:shadow-[0_26px_75px_rgba(11,37,69,0.13)]"
    >
      <div className={`h-1.5 bg-gradient-to-r ${statusDesign.routeClassName}`} />

      <button
        type="button"
        onClick={onToggle}
        className="block w-full p-4 text-left sm:p-5 lg:p-6"
        aria-expanded={expanded}
      >
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
          {/* Route identity */}
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <span
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.15rem] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)] ${statusDesign.iconClassName}`}
            >
              <StatusIcon className="h-6 w-6" />
            </span>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.12em] text-primary">
                  {booking.bookingNumber}
                </p>

                <span
                  className={`rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] ${statusDesign.badgeClassName}`}
                >
                  {statusDesign.label}
                </span>
              </div>

              <h2 className="mt-2 truncate font-heading text-lg font-black text-navy sm:text-xl">
                {booking.serviceName}
              </h2>

              <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-slate-500">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                {booking.addressLabel}
              </p>

              <div className="mt-3 flex items-center gap-3">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${statusDesign.routeClassName}`}
                    style={{ width: `${getStatusProgress(booking.status)}%` }}
                  />
                </div>
                <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                  {getStatusProgress(booking.status)}% route
                </span>
              </div>
            </div>
          </div>

          {/* Route line */}
          <div className="hidden min-w-[170px] flex-1 items-center xl:flex">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />

            <span className={`h-1 flex-1 bg-gradient-to-r ${statusDesign.routeClassName}`} />

            <span className="flex h-8 w-8 items-center justify-center rounded-full border-4 border-primary-light bg-white">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </span>
          </div>

          {/* Schedule */}
          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[460px]">
            <CompactDetail
              icon={CalendarDays}
              label="Cleaning date"
              value={formatBookingDate(booking.bookingDate)}
            />

            <CompactDetail
              icon={Clock3}
              label="Time route"
              value={
                booking.startTime
                  ? `${booking.startTime} – ${booking.endTime || "—"}`
                  : "Unavailable"
              }
            />

            <CompactDetail
              icon={ReceiptText}
              label="Route total"
              value={formatCurrency(booking.totalAmount)}
            />
          </div>

          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-primary-light text-primary transition-transform duration-300 ${
              expanded ? "rotate-180 bg-primary text-white" : ""
            }`}
          >
            <ChevronDown className="h-4 w-4" />
          </span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{
              height: 0,
              opacity: 0,
            }}
            animate={{
              height: "auto",
              opacity: 1,
            }}
            exit={{
              height: 0,
              opacity: 0,
            }}
            transition={{
              duration: 0.3,
            }}
            className="overflow-hidden"
          >
            <div className="border-t border-primary/10 bg-surface-soft/70 p-4 sm:p-5 lg:p-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ExpandedDetail
                  icon={Clock3}
                  label="Estimated duration"
                  value={formatDuration(booking.estimatedDurationMinutes)}
                />

                <ExpandedDetail
                  icon={UserRound}
                  label="Assigned cleaner"
                  value={booking.assignedCleanerName ?? "Waiting for admin assignment"}
                />

                <ExpandedDetail
                  icon={CreditCard}
                  label="Payment"
                  value={`${paymentMethodLabel(booking.paymentMethod)} · ${booking.paymentStatus}`}
                />

                <ExpandedDetail
                  icon={MapPin}
                  label="Service destination"
                  value={booking.addressLabel}
                />
              </div>

              <BookingJourney status={booking.status} />

              {booking.status === "completed" && (
                <>
                  <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-[linear-gradient(120deg,#fffbeb,#ffffff)] p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                        <Star className="h-5 w-5 fill-current" />
                      </span>
                      <div>
                        <p className="font-heading text-lg font-black text-navy">
                          {booking.reviewId
                            ? "Thanks for reviewing this cleaning"
                            : "How was your cleaning?"}
                        </p>
                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                          {booking.reviewId
                            ? `Your verified rating: ${booking.reviewRating ?? 0} out of 5`
                            : "Share a verified review in less than a minute."}
                        </p>
                      </div>
                    </div>

                    {booking.canReview ? (
                      <Link
                        href={`/bookings/${booking.id}/review`}
                        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-navy px-5 text-sm font-extrabold text-white transition hover:bg-primary"
                      >
                        Rate your cleaning
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <Link
                        href="/reviews"
                        className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-white px-5 text-sm font-extrabold text-amber-700 transition hover:bg-amber-50"
                      >
                        View my reviews
                      </Link>
                    )}
                  </div>

                  <div className="mt-5">
                    <p className="mb-3 text-[9px] font-extrabold uppercase tracking-[0.15em] text-primary">
                      Completion report
                    </p>
                    <ServiceProofReportPanel bookingId={booking.id} audience="customer" />
                  </div>
                </>
              )}

              <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-primary/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-primary">
                    Booking assurance
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Your booking details and payment status are kept together in this protected
                    route record.
                  </p>
                </div>

                <span className="inline-flex items-center gap-2 rounded-xl bg-primary-light px-4 py-2.5 text-xs font-bold text-primary">
                  <ShieldCheck className="h-4 w-4" />
                  CleanNest protected
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function BookingJourney({ status }: { status: BookingStatus }) {
  const steps = [
    {
      label: "Requested",
      icon: ReceiptText,
    },
    {
      label: "Approved",
      icon: ShieldCheck,
    },
    {
      label: "Cleaning",
      icon: Sparkles,
    },
    {
      label: "Completed",
      icon: CheckCircle2,
    },
  ];

  const activeStep =
    status === "pending"
      ? 0
      : status === "confirmed"
        ? 1
        : status === "in_progress"
          ? 2
          : status === "completed"
            ? 3
            : 0;

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-primary/10 bg-white p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-primary">
            Cleaning journey
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {status === "cancelled"
              ? "This route was cancelled before completion."
              : "Follow your booking from request to a finished clean."}
          </p>
        </div>

        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-surface-soft px-3 py-2 text-[10px] font-extrabold text-slate-500">
          <TimerReset className="h-3.5 w-3.5 text-primary" />
          Live status
        </span>
      </div>

      <div className="relative mt-6 grid grid-cols-4 gap-2">
        <div className="absolute left-[12.5%] right-[12.5%] top-5 h-0.5 bg-slate-100" />
        <div
          className={`absolute left-[12.5%] top-5 h-0.5 bg-gradient-to-r ${
            status === "cancelled" ? "from-red-300 to-red-500" : "from-primary to-emerald-400"
          }`}
          style={{
            width:
              status === "cancelled"
                ? "0%"
                : `${(activeStep / Math.max(steps.length - 1, 1)) * 75}%`,
          }}
        />

        {steps.map((step, index) => {
          const Icon = step.icon;
          const isReached = status !== "cancelled" && index <= activeStep;

          return (
            <div
              key={step.label}
              className="relative flex min-w-0 flex-col items-center text-center"
            >
              <span
                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                  isReached
                    ? "border-primary bg-primary text-white shadow-[0_8px_20px_rgba(30,111,217,0.22)]"
                    : status === "cancelled" && index === 0
                      ? "border-red-200 bg-red-50 text-red-500"
                      : "border-slate-200 bg-white text-slate-300"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span
                className={`mt-3 truncate text-[9px] font-extrabold uppercase tracking-[0.08em] ${
                  isReached ? "text-navy" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

interface CompactDetailProps {
  icon: ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
}

function CompactDetail({ icon: Icon, label, value }: CompactDetailProps) {
  return (
    <div className="rounded-xl border border-primary/10 bg-surface-soft px-3 py-3">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-primary" />

        <p className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>
      </div>

      <p className="mt-2 truncate text-[11px] font-bold text-navy">{value}</p>
    </div>
  );
}

interface ExpandedDetailProps {
  icon: ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
}

function ExpandedDetail({ icon: Icon, label, value }: ExpandedDetailProps) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-white p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
        <Icon className="h-4 w-4" />
      </span>

      <p className="mt-4 text-[9px] font-extrabold uppercase tracking-[0.13em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-xs font-bold leading-5 text-navy">{value}</p>
    </div>
  );
}
