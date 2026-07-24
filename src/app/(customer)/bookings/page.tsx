"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from "react";

import Link from "next/link";

import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  History,
  LoaderCircle,
  MapPin,
  ReceiptText,
  RefreshCw,
  Search,
  Sparkles,
  UserRound,
  XCircle,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

type BookingFilter =
  | "all"
  | "active"
  | "completed"
  | "cancelled";

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

const STATUS_DESIGNS: Record<
  BookingStatus,
  StatusDesign
> = {
  pending: {
    label: "Pending",
    icon: Clock3,
    badgeClassName:
      "border-amber-200 bg-amber-50 text-amber-700",
    iconClassName:
      "bg-amber-100 text-amber-600",
    routeClassName:
      "from-amber-400 to-orange-400",
  },

  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    badgeClassName:
      "border-blue-200 bg-blue-50 text-primary",
    iconClassName:
      "bg-primary-light text-primary",
    routeClassName:
      "from-primary to-cyan-400",
  },

  in_progress: {
    label: "In progress",
    icon: Sparkles,
    badgeClassName:
      "border-cyan-200 bg-cyan-50 text-cyan-700",
    iconClassName:
      "bg-cyan-100 text-cyan-700",
    routeClassName:
      "from-cyan-400 to-emerald-400",
  },

  completed: {
    label: "Completed",
    icon: CheckCircle2,
    badgeClassName:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    iconClassName:
      "bg-emerald-100 text-emerald-700",
    routeClassName:
      "from-emerald-400 to-emerald-600",
  },

  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    badgeClassName:
      "border-red-200 bg-red-50 text-red-700",
    iconClassName:
      "bg-red-100 text-red-600",
    routeClassName:
      "from-red-300 to-red-500",
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

function normalizeStatus(
  status?: string,
): BookingStatus {
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

function extractBookingArray(
  payload: unknown,
): BookingApiItem[] {
  if (
    typeof payload !== "object" ||
    payload === null
  ) {
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

  if (
    typeof response.data === "object" &&
    response.data !== null
  ) {
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

function normalizeBooking(
  booking: BookingApiItem,
  index: number,
): BookingRecord {
  const addressParts = [
    booking.address?.label,
    booking.address?.area,
    booking.address?.city,
  ].filter(Boolean);

  return {
    id:
      booking.id ??
      booking._id ??
      `booking-${index}`,

    bookingNumber:
      booking.bookingNumber ??
      `CN-ROUTE-${index + 1}`,

    status: normalizeStatus(
      booking.status,
    ),

    bookingDate:
      booking.bookingDate ?? "",

    startTime:
      booking.startTime ?? "",

    endTime:
      booking.endTime ?? "",

    estimatedDurationMinutes:
      Number(
        booking.estimatedDurationMinutes,
      ) || 0,

    totalAmount:
      Number(booking.totalAmount) || 0,

    serviceName:
      booking.service?.name ??
      booking.serviceName ??
      "Cleaning service",

    addressLabel:
      addressParts.join(" · ") ||
      booking.addressLabel ||
      "Address unavailable",

    assignedCleanerName:
      booking.assignedCleanerName ??
      null,

    paymentMethod:
      booking.paymentMethod ??
      "cash",

    paymentStatus:
      booking.paymentStatus ??
      "unpaid",
  };
}

function formatCurrency(
  value: number,
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
    },
  ).format(value);
}

function formatBookingDate(
  value: string,
) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "Asia/Beirut",
    },
  ).format(date);
}

function formatDuration(
  minutes: number,
) {
  if (minutes <= 0) {
    return "Not calculated";
  }

  const hours = Math.floor(
    minutes / 60,
  );

  const remainingMinutes =
    minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  }

  if (
    remainingMinutes === 0
  ) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

function paymentMethodLabel(
  value: string,
) {
  return value === "card"
    ? "Test card"
    : "Cash after service";
}

function matchesFilter(
  booking: BookingRecord,
  filter: BookingFilter,
) {
  if (filter === "all") {
    return true;
  }

  if (filter === "active") {
    return [
      "pending",
      "confirmed",
      "in_progress",
    ].includes(booking.status);
  }

  return booking.status === filter;
}

export default function MyBookingsPage() {
  const prefersReducedMotion =
    useReducedMotion();

  const [bookings, setBookings] =
    useState<BookingRecord[]>([]);

  const [selectedFilter, setSelectedFilter] =
    useState<BookingFilter>("all");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [
    expandedBookingId,
    setExpandedBookingId,
  ] = useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  async function loadBookings() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        "/api/customer/bookings",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        },
      );

      const payload: unknown =
        await response.json();

      if (!response.ok) {
        const errorPayload =
          payload as {
            message?: string;
            error?: string;
          };

        throw new Error(
          errorPayload.message ??
            errorPayload.error ??
            "Unable to load your bookings.",
        );
      }

      const rawBookings =
        extractBookingArray(payload);

      const normalizedBookings =
        rawBookings
          .map(normalizeBooking)
          .sort((first, second) => {
            const firstDate =
              new Date(
                first.bookingDate,
              ).getTime();

            const secondDate =
              new Date(
                second.bookingDate,
              ).getTime();

            return (
              secondDate - firstDate
            );
          });

      setBookings(
        normalizedBookings,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load your bookings.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadBookings();
  }, []);

  const bookingCounts =
    useMemo(() => {
      return {
        all: bookings.length,

        active: bookings.filter(
          (booking) =>
            [
              "pending",
              "confirmed",
              "in_progress",
            ].includes(
              booking.status,
            ),
        ).length,

        completed:
          bookings.filter(
            (booking) =>
              booking.status ===
              "completed",
          ).length,

        cancelled:
          bookings.filter(
            (booking) =>
              booking.status ===
              "cancelled",
          ).length,
      };
    }, [bookings]);

  const filteredBookings =
    useMemo(() => {
      const normalizedSearch =
        searchQuery
          .trim()
          .toLowerCase();

      return bookings.filter(
        (booking) => {
          if (
            !matchesFilter(
              booking,
              selectedFilter,
            )
          ) {
            return false;
          }

          if (!normalizedSearch) {
            return true;
          }

          return [
            booking.bookingNumber,
            booking.serviceName,
            booking.addressLabel,
            booking.assignedCleanerName ??
              "",
          ].some((value) =>
            value
              .toLowerCase()
              .includes(
                normalizedSearch,
              ),
          );
        },
      );
    }, [
      bookings,
      searchQuery,
      selectedFilter,
    ]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f7fc] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(30,111,217,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(30,111,217,0.045) 1px, transparent 1px)",
          backgroundSize:
            "46px 46px",
        }}
      />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-44 top-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
        animate={
          prefersReducedMotion
            ? undefined
            : {
                scale: [
                  1,
                  1.18,
                  1,
                ],
                y: [
                  0,
                  30,
                  0,
                ],
              }
        }
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative mx-auto max-w-[1450px]">
        {/* Header */}
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy text-cyan-300 shadow-[0_14px_35px_rgba(11,37,69,0.2)]">
                <History className="h-5 w-5" />
              </span>

              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-primary">
                  CleanNest route archive
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Your active and previous cleaning journeys
                </p>
              </div>
            </div>

            <h1 className="mt-5 font-heading text-3xl font-black tracking-[-0.04em] text-navy sm:text-4xl lg:text-5xl">
              My cleaning routes
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              Track upcoming visits, cleaner assignments,
              completed services, payments, and cancelled routes
              from one timeline.
            </p>
          </div>

          <Link
            href="/book-service"
            className="group flex min-h-12 w-fit items-center justify-center gap-3 rounded-2xl bg-navy px-6 text-sm font-bold text-white shadow-[0_16px_40px_rgba(11,37,69,0.22)] transition hover:-translate-y-0.5"
          >
            <Sparkles className="h-4 w-4 text-cyan-300" />

            Build a new route

            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </header>

        {/* Summary cards */}
        <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <RouteMetric
            label="All routes"
            value={bookingCounts.all}
            icon={ReceiptText}
            description="Complete booking archive"
          />

          <RouteMetric
            label="Active routes"
            value={bookingCounts.active}
            icon={CalendarDays}
            description="Pending or scheduled"
          />

          <RouteMetric
            label="Completed"
            value={bookingCounts.completed}
            icon={CheckCircle2}
            description="Successfully finished"
          />

          <RouteMetric
            label="Cancelled"
            value={bookingCounts.cancelled}
            icon={XCircle}
            description="Closed before service"
          />
        </section>

        {/* Search and filters */}
        <section className="mt-6 rounded-[1.7rem] border border-white/80 bg-white/80 p-4 shadow-[0_18px_55px_rgba(11,37,69,0.08)] backdrop-blur-xl sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(
                    event.target.value,
                  );
                }}
                placeholder="Search route, service, address, or cleaner"
                className="min-h-12 w-full rounded-2xl border border-primary/10 bg-surface-soft pl-11 pr-4 text-sm font-semibold text-navy outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-primary/35 focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {FILTERS.map(
                (filter) => {
                  const isSelected =
                    selectedFilter ===
                    filter.id;

                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => {
                        setSelectedFilter(
                          filter.id,
                        );
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
                          isSelected
                            ? "bg-white/10 text-cyan-200"
                            : "bg-primary-light text-primary"
                        }`}
                      >
                        {
                          bookingCounts[
                            filter.id
                          ]
                        }
                      </span>
                    </button>
                  );
                },
              )}

              <button
                type="button"
                onClick={() => {
                  void loadBookings();
                }}
                disabled={isLoading}
                className="flex shrink-0 items-center gap-2 rounded-xl border border-primary/10 bg-white px-4 py-2.5 text-xs font-bold text-slate-500 transition hover:border-primary/25 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    isLoading
                      ? "animate-spin"
                      : ""
                  }`}
                />

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

              <p className="mt-4 text-sm font-bold text-navy">
                Loading your cleaning routes
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Connecting to the CleanNest booking archive.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {!isLoading &&
          errorMessage && (
            <div className="mt-6 rounded-[2rem] border border-red-200 bg-red-50 p-8 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-red-500" />

              <h2 className="mt-4 font-heading text-xl font-bold text-red-800">
                We could not load your routes
              </h2>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-red-600">
                {errorMessage}
              </p>

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
        {!isLoading &&
          !errorMessage &&
          filteredBookings.length ===
            0 && (
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
                    Create a new CleanNest route or change the
                    current search and filter options.
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
                  {[
                    "Space",
                    "Plan",
                    "Address",
                    "Time",
                  ].map(
                    (routePoint, index) => (
                      <motion.div
                        key={routePoint}
                        animate={
                          prefersReducedMotion
                            ? undefined
                            : {
                                y: [
                                  0,
                                  index % 2 ===
                                  0
                                    ? -5
                                    : 5,
                                  0,
                                ],
                              }
                        }
                        transition={{
                          duration:
                            3 + index,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="flex flex-col justify-between rounded-2xl border border-white bg-white/80 p-4"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
                          <Sparkles className="h-4 w-4" />
                        </span>

                        <p className="text-xs font-bold text-navy">
                          {routePoint}
                        </p>
                      </motion.div>
                    ),
                  )}
                </div>
              </div>
            </div>
          )}

        {/* Booking routes */}
        {!isLoading &&
          !errorMessage &&
          filteredBookings.length >
            0 && (
            <section className="mt-6 space-y-4">
              <AnimatePresence initial={false}>
                {filteredBookings.map(
                  (booking, index) => (
                    <BookingRouteCard
                      key={booking.id}
                      booking={booking}
                      index={index}
                      expanded={
                        expandedBookingId ===
                        booking.id
                      }
                      onToggle={() => {
                        setExpandedBookingId(
                          (
                            currentBookingId,
                          ) =>
                            currentBookingId ===
                            booking.id
                              ? null
                              : booking.id,
                        );
                      }}
                    />
                  ),
                )}
              </AnimatePresence>
            </section>
          )}
      </div>
    </main>
  );
}

interface RouteMetricProps {
  label: string;
  value: number;
  description: string;
  icon: ComponentType<{
    className?: string;
  }>;
}

function RouteMetric({
  label,
  value,
  description,
  icon: Icon,
}: RouteMetricProps) {
  return (
    <div className="rounded-[1.5rem] border border-white/80 bg-white/80 p-5 shadow-[0_15px_45px_rgba(11,37,69,0.07)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-primary">
            {label}
          </p>

          <p className="mt-2 font-heading text-3xl font-black text-navy">
            {value}
          </p>

          <p className="mt-2 text-[11px] text-slate-400">
            {description}
          </p>
        </div>

        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-light text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

interface BookingRouteCardProps {
  booking: BookingRecord;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}

function BookingRouteCard({
  booking,
  index,
  expanded,
  onToggle,
}: BookingRouteCardProps) {
  const statusDesign =
    STATUS_DESIGNS[booking.status];

  const StatusIcon =
    statusDesign.icon;

  return (
    <motion.article
      layout
      initial={{
        opacity: 0,
        y: 18,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: -12,
      }}
      transition={{
        duration: 0.35,
        delay: Math.min(
          index * 0.05,
          0.3,
        ),
      }}
      className="overflow-hidden rounded-[1.8rem] border border-white/80 bg-white/85 shadow-[0_20px_60px_rgba(11,37,69,0.09)] backdrop-blur-xl"
    >
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
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${statusDesign.iconClassName}`}
            >
              <StatusIcon className="h-5 w-5" />
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
            </div>
          </div>

          {/* Route line */}
          <div className="hidden min-w-[170px] flex-1 items-center xl:flex">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />

            <span
              className={`h-1 flex-1 bg-gradient-to-r ${statusDesign.routeClassName}`}
            />

            <span className="flex h-8 w-8 items-center justify-center rounded-full border-4 border-primary-light bg-white">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </span>
          </div>

          {/* Schedule */}
          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[460px]">
            <CompactDetail
              icon={CalendarDays}
              label="Cleaning date"
              value={formatBookingDate(
                booking.bookingDate,
              )}
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
              value={formatCurrency(
                booking.totalAmount,
              )}
            />
          </div>

          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-primary-light text-primary transition-transform ${
              expanded
                ? "rotate-90"
                : ""
            }`}
          >
            <ArrowRight className="h-4 w-4" />
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
                  value={formatDuration(
                    booking.estimatedDurationMinutes,
                  )}
                />

                <ExpandedDetail
                  icon={UserRound}
                  label="Assigned cleaner"
                  value={
                    booking.assignedCleanerName ??
                    "Waiting for admin assignment"
                  }
                />

                <ExpandedDetail
                  icon={CreditCard}
                  label="Payment"
                  value={`${paymentMethodLabel(
                    booking.paymentMethod,
                  )} · ${booking.paymentStatus}`}
                />

                <ExpandedDetail
                  icon={MapPin}
                  label="Service destination"
                  value={booking.addressLabel}
                />
              </div>

              <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-primary/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-primary">
                    Route controls
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Editing, cancellation, and rescheduling
                    controls will appear here when connected
                    to their booking actions.
                  </p>
                </div>

                <span className="rounded-xl bg-primary-light px-4 py-2.5 text-xs font-bold text-primary">
                  {statusDesign.label}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

interface CompactDetailProps {
  icon: ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
}

function CompactDetail({
  icon: Icon,
  label,
  value,
}: CompactDetailProps) {
  return (
    <div className="rounded-xl border border-primary/10 bg-surface-soft px-3 py-3">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-primary" />

        <p className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>
      </div>

      <p className="mt-2 truncate text-[11px] font-bold text-navy">
        {value}
      </p>
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

function ExpandedDetail({
  icon: Icon,
  label,
  value,
}: ExpandedDetailProps) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-white p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
        <Icon className="h-4 w-4" />
      </span>

      <p className="mt-4 text-[9px] font-extrabold uppercase tracking-[0.13em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-xs font-bold leading-5 text-navy">
        {value}
      </p>
    </div>
  );
}