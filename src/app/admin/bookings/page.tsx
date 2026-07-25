"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Activity,
  ArrowUpRight,
  Banknote,
  CalendarCheck2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";

interface BookingRow {
  _id: string;
  bookingNumber: string;
  bookingDate: string;
  startTime?: string;
  endTime?: string;
  status: string;
  totalAmount: number;
  customerId?: { name?: string; email?: string } | string | null;
  serviceId?: { name?: string } | string | null;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface BookingListData {
  bookings: BookingRow[];
  total: number;
  page: number;
  limit: number;
}

interface FiltersState {
  status: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

const EMPTY_FILTERS: FiltersState = {
  status: "",
  dateFrom: "",
  dateTo: "",
  search: "",
};

const STATUS_OPTIONS = [
  { value: "", label: "All bookings" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Approved" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_TAB_TONES: Record<string, string> = {
  pending: "from-amber-400 to-orange-500",
  confirmed: "from-emerald-400 to-emerald-600",
  in_progress: "from-blue-400 to-blue-600",
  completed: "from-cyan-400 to-emerald-500",
  cancelled: "from-rose-400 to-rose-600",
};

const ROW_GLOW: Record<string, string> = {
  pending: "group-hover:shadow-[inset_3px_0_0_#D97706]",
  confirmed: "group-hover:shadow-[inset_3px_0_0_#16A34A]",
  in_progress: "group-hover:shadow-[inset_3px_0_0_#2563EB]",
  completed: "group-hover:shadow-[inset_3px_0_0_#16A34A]",
  cancelled: "group-hover:shadow-[inset_3px_0_0_#DC2626]",
};

function populatedName(
  value: BookingRow["customerId"] | BookingRow["serviceId"],
  fallback = "Not available"
) {
  if (!value || typeof value === "string") return fallback;
  return value.name ?? fallback;
}

function customerEmail(customer: BookingRow["customerId"]) {
  if (!customer || typeof customer === "string") return "";
  return customer.email ?? "";
}

function initials(name: string) {
  if (name === "Not available") return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatBookingDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function BookingSkeleton() {
  return (
    <div className="animate-pulse space-y-3 px-6 py-5">
      <div className="h-4 w-full rounded-full bg-navy/[0.06]" />
      <div className="h-4 w-3/4 rounded-full bg-navy/[0.04]" />
    </div>
  );
}

export default function AdminBookingsPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [filters, setFilters] = useState<FiltersState>(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<BookingListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lastRequestKey = useRef("");

  const fetchBookings = useCallback(
    async (currentFilters: FiltersState, currentPage: number) => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const params = new URLSearchParams({ page: String(currentPage) });
        if (currentFilters.status) params.set("status", currentFilters.status);
        if (currentFilters.dateFrom) params.set("dateFrom", currentFilters.dateFrom);
        if (currentFilters.dateTo) params.set("dateTo", currentFilters.dateTo);
        if (currentFilters.search) params.set("search", currentFilters.search);

        const response = await fetch(`/api/admin/bookings?${params.toString()}`, {
          cache: "no-store",
        });
        const json: ApiEnvelope<BookingListData> = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(json.error ?? "Failed to load bookings");
        }

        setData(json.data ?? null);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load bookings"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const requestKey = JSON.stringify([filters, page]);
    if (lastRequestKey.current === requestKey) {
      return;
    }

    lastRequestKey.current = requestKey;
    void fetchBookings(filters, page);
  }, [fetchBookings, filters, page]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      setFilters((previous) => ({ ...previous, search: searchInput.trim() }));
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const bookings = data?.bookings ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const hasActiveFilters = Boolean(
    filters.status || filters.dateFrom || filters.dateTo || filters.search
  );
  const pageValue = bookings.reduce(
    (total, booking) => total + (booking.totalAmount || 0),
    0
  );
  const activeOnPage = bookings.filter((booking) =>
    ["confirmed", "in_progress"].includes(booking.status)
  ).length;
  const pendingOnPage = bookings.filter(
    (booking) => booking.status === "pending"
  ).length;

  function updateFilters(patch: Partial<FiltersState>) {
    setPage(1);
    setFilters((previous) => ({ ...previous, ...patch }));
  }

  function clearFilters() {
    setSearchInput("");
    setPage(1);
    setFilters(EMPTY_FILTERS);
  }

  function openBooking(bookingId: string) {
    router.push(`/admin/bookings/${bookingId}`);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f8fd] px-4 py-6 sm:px-6 sm:py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(#1e6fd9 1px, transparent 1px), linear-gradient(90deg, #1e6fd9 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "linear-gradient(to bottom, black, transparent 72%)",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-24 h-80 w-80 rounded-full bg-cyan-300/20 blur-[90px]"
        animate={
          reduceMotion
            ? undefined
            : { x: [0, 70, 0], y: [0, -24, 0], scale: [1, 1.14, 1] }
        }
        transition={{ duration: 14, repeat: 0, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-[32rem] h-96 w-96 rounded-full bg-primary/15 blur-[110px]"
        animate={
          reduceMotion
            ? undefined
            : { x: [0, -60, 0], y: [0, 35, 0], scale: [1, 1.1, 1] }
        }
        transition={{ duration: 17, repeat: 0, ease: "easeInOut" }}
      />

      <motion.div
        className="relative mx-auto max-w-7xl space-y-6"
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.section
          className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(125deg,#071d38_0%,#0b315d_48%,#125eaa_100%)] px-6 py-8 text-white shadow-[0_24px_70px_rgba(11,37,69,0.24)] sm:px-8 lg:px-10 lg:py-10"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,.45) 1px, transparent 0)",
              backgroundSize: "24px 24px",
              maskImage: "linear-gradient(90deg, transparent, black)",
            }}
          />
          <motion.div
            aria-hidden
            className="absolute -right-16 -top-24 h-72 w-72 rounded-full border border-cyan-200/20 bg-cyan-300/15 blur-sm"
            animate={reduceMotion ? undefined : { rotate: 360 }}
            transition={{ duration: 30, repeat: 0, ease: "linear" }}
          />
          <motion.div
            aria-hidden
            className="absolute -right-2 top-8 h-40 w-40 rounded-full border border-dashed border-white/15"
            animate={reduceMotion ? undefined : { rotate: -360 }}
            transition={{ duration: 22, repeat: 0, ease: "linear" }}
          />
          <div className="absolute bottom-0 right-1/4 h-24 w-52 rounded-full bg-cyan-400/10 blur-2xl" />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <motion.div
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200 backdrop-blur-md"
                initial={reduceMotion ? false : { opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.16, duration: 0.45 }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-60 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300" />
                </span>
                Live operations center
              </motion.div>
              <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                Every booking.
                <span className="block bg-gradient-to-r from-cyan-200 via-white to-blue-200 bg-clip-text text-transparent">
                  Beautifully under control.
                </span>
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/65 sm:text-base">
                Review every cleaning visit, follow its progress, and open the full
                booking record from one organized workspace.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-medium text-white/55">
                <span className="inline-flex items-center gap-1.5">
                  <Zap size={14} className="text-cyan-300" />
                  Fast booking triage
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Activity size={14} className="text-emerald-300" />
                  Live status visibility
                </span>
              </div>
            </div>

            <motion.div
              className="grid grid-cols-3 gap-2 sm:gap-3"
              initial={reduceMotion ? false : "hidden"}
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
              }}
            >
              {[
                {
                  label: "Results",
                  value: loading ? "—" : String(data?.total ?? 0),
                  icon: CalendarCheck2,
                },
                {
                  label: "Pending",
                  value: loading ? "—" : String(pendingOnPage),
                  icon: Clock3,
                },
                {
                  label: "Page value",
                  value: loading ? "—" : formatMoney(pageValue),
                  icon: Banknote,
                },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  variants={{
                    hidden: { opacity: 0, y: 14 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  whileHover={reduceMotion ? undefined : { y: -4, scale: 1.02 }}
                  className="group min-w-0 rounded-2xl border border-white/10 bg-white/[0.09] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md transition-colors hover:bg-white/[0.14] sm:min-w-[128px] sm:px-4"
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/55">
                    <item.icon size={13} />
                    {item.label}
                  </div>
                  <p className="mt-1.5 truncate font-heading text-lg font-semibold text-white">
                    {item.value}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        <AnimatePresence initial={false}>
          {errorMessage && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="flex flex-wrap items-center gap-3 overflow-hidden rounded-2xl border border-status-cancelled/20 bg-white px-4 py-3.5 text-sm shadow-[0_12px_30px_rgba(220,38,38,0.08)]"
            >
              <motion.span
                animate={reduceMotion ? undefined : { rotate: [0, -8, 8, 0] }}
                transition={{ duration: 0.45 }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-status-cancelled/10 text-status-cancelled"
              >
                <CircleAlert size={18} />
              </motion.span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-navy">Bookings could not be loaded</p>
                <p className="text-navy/55">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => fetchBookings(filters, page)}
                className="inline-flex items-center gap-2 rounded-xl bg-navy px-3.5 py-2 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-lg"
              >
                <RotateCcw size={14} />
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.section
          layout
          className="overflow-hidden rounded-[24px] border border-white bg-white/95 shadow-[0_20px_50px_rgba(11,37,69,0.10)] backdrop-blur-md"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="border-b border-navy/[0.06] p-4 sm:p-5">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="mr-2 inline-flex items-center gap-2 text-sm font-semibold text-navy">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-light text-primary">
                  <SlidersHorizontal size={15} />
                </span>
                Smart queue
              </span>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((option) => {
                  const selected = filters.status === option.value;
                  return (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => updateFilters({ status: option.value })}
                      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                      className={`relative overflow-hidden rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
                        selected
                          ? "text-white shadow-[0_6px_16px_rgba(30,111,217,0.24)]"
                          : "border border-transparent bg-surface-soft text-navy/55 hover:border-primary/10 hover:bg-primary-light hover:text-primary"
                      }`}
                    >
                      {selected && (
                        <motion.span
                          layoutId="active-booking-status"
                          className={`absolute inset-0 bg-gradient-to-r ${
                            STATUS_TAB_TONES[option.value] ??
                            "from-primary to-blue-500"
                          }`}
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        />
                      )}
                      <span className="relative z-10">{option.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_auto_auto]">
              <label className="relative block">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-navy/35"
                />
                <input
                  type="search"
                  placeholder="Search by customer name..."
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className="h-11 w-full rounded-xl border border-navy/10 bg-surface-soft/60 pl-10 pr-10 text-sm text-navy outline-none transition focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/10"
                />
                {searchInput && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearchInput("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/35 hover:text-navy"
                  >
                    <X size={16} />
                  </button>
                )}
              </label>

              <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-navy/10 bg-surface-soft/60">
                <label className="flex min-w-0 items-center gap-2 border-r border-navy/10 px-3">
                  <CalendarDays size={16} className="shrink-0 text-primary" />
                  <input
                    aria-label="Bookings from date"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(event) => updateFilters({ dateFrom: event.target.value })}
                    className="h-10 min-w-0 bg-transparent text-xs text-navy outline-none"
                  />
                </label>
                <label className="flex min-w-0 items-center gap-2 px-3">
                  <span className="text-xs text-navy/35">to</span>
                  <input
                    aria-label="Bookings to date"
                    type="date"
                    value={filters.dateTo}
                    onChange={(event) => updateFilters({ dateTo: event.target.value })}
                    className="h-10 min-w-0 bg-transparent text-xs text-navy outline-none"
                  />
                </label>
              </div>

              <button
                type="button"
                disabled={!hasActiveFilters}
                onClick={clearFilters}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-navy/10 px-4 text-sm font-semibold text-navy/60 transition hover:border-primary/20 hover:bg-primary-light hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
              >
                <RotateCcw size={15} />
                Reset
              </button>
            </div>

            {!loading && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-soft/70 px-3.5 py-2.5 text-xs text-navy/45">
                <span className="inline-flex items-center gap-2">
                  <LayoutDashboard size={14} className="text-primary" />
                  Showing{" "}
                  <strong className="font-semibold text-navy">{bookings.length}</strong>
                  {" "}of{" "}
                  <strong className="font-semibold text-navy">{data?.total ?? 0}</strong>
                  {" "}matching bookings
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    {activeOnPage > 0 && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-confirmed opacity-50 motion-reduce:animate-none" />
                    )}
                    <span className="relative h-2 w-2 rounded-full bg-status-confirmed" />
                  </span>
                  {activeOnPage} active visits on this page
                </span>
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-navy/[0.06] bg-surface-soft/50 text-[11px] font-semibold uppercase tracking-[0.1em] text-navy/40">
                  <th className="px-6 py-3.5">Booking</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Service</th>
                  <th className="px-4 py-3.5">Schedule</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Amount</th>
                  <th className="w-16 px-5 py-3.5">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index} className="border-b border-navy/[0.05]">
                      <td colSpan={7}>
                        <BookingSkeleton />
                      </td>
                    </tr>
                  ))
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyBookings filtered={hasActiveFilters} onReset={clearFilters} />
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking, index) => {
                    const name = populatedName(booking.customerId);
                    return (
                      <motion.tr
                        key={booking._id}
                        onClick={() => openBooking(booking._id)}
                        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.34,
                          delay: reduceMotion ? 0 : Math.min(index * 0.035, 0.28),
                        }}
                        className={`group cursor-pointer border-b border-navy/[0.05] transition-all last:border-0 hover:bg-primary/[0.04] ${
                          ROW_GLOW[booking.status] ?? ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-navy">{booking.bookingNumber}</p>
                          <p className="mt-0.5 text-xs text-navy/40">View full record</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-light text-xs font-bold text-primary">
                              {initials(name)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-navy">{name}</p>
                              <p className="max-w-[170px] truncate text-xs text-navy/40">
                                {customerEmail(booking.customerId) || "Customer account"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-2 font-medium text-navy/70">
                            <Sparkles size={15} className="text-primary" />
                            {populatedName(booking.serviceId)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-navy">
                            {formatBookingDate(booking.bookingDate)}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-navy/45">
                            <Clock3 size={12} />
                            {booking.startTime || "Time pending"}
                            {booking.endTime ? ` – ${booking.endTime}` : ""}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <BookingStatusBadge status={booking.status} />
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-navy">
                          {formatMoney(booking.totalAmount)}
                        </td>
                        <td className="px-5 py-4">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-navy/10 text-navy/35 transition-all group-hover:border-primary/20 group-hover:bg-primary group-hover:text-white">
                            <ArrowUpRight size={16} />
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-navy/[0.06] md:hidden">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <BookingSkeleton key={index} />
              ))
            ) : bookings.length === 0 ? (
              <EmptyBookings filtered={hasActiveFilters} onReset={clearFilters} />
            ) : (
              bookings.map((booking, index) => {
                const name = populatedName(booking.customerId);
                return (
                  <motion.button
                    key={booking._id}
                    type="button"
                    onClick={() => openBooking(booking._id)}
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: reduceMotion ? 0 : Math.min(index * 0.045, 0.25),
                    }}
                    whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                    className="block w-full p-5 text-left transition-colors hover:bg-primary/[0.035]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-navy">{booking.bookingNumber}</p>
                        <p className="mt-1 text-xs text-navy/45">
                          {formatBookingDate(booking.bookingDate)} ·{" "}
                          {booking.startTime || "Time pending"}
                        </p>
                      </div>
                      <BookingStatusBadge status={booking.status} />
                    </div>
                    <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-4">
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2 text-navy/70">
                          <UserRound size={15} className="text-primary" />
                          {name}
                        </p>
                        <p className="flex items-center gap-2 text-navy/70">
                          <Sparkles size={15} className="text-primary" />
                          {populatedName(booking.serviceId)}
                        </p>
                      </div>
                      <p className="font-heading text-base font-semibold text-navy">
                        {formatMoney(booking.totalAmount)}
                      </p>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>

          {data && totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-navy/[0.06] bg-surface-soft/40 px-5 py-4 text-sm">
              <p className="text-navy/50">
                Page <strong className="font-semibold text-navy">{data.page}</strong> of{" "}
                <strong className="font-semibold text-navy">{totalPages}</strong>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => current - 1)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-navy/10 bg-white px-3 text-xs font-semibold text-navy transition hover:border-primary/20 hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronLeft size={15} />
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((current) => current + 1)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-navy px-3 text-xs font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Next
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </motion.section>
      </motion.div>
    </main>
  );
}

function EmptyBookings({
  filtered,
  onReset,
}: {
  filtered: boolean;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light text-primary">
        <ClipboardList size={27} strokeWidth={1.8} />
      </span>
      <h2 className="mt-4 font-heading text-lg font-semibold text-navy">
        {filtered ? "No matching bookings" : "No bookings yet"}
      </h2>
      <p className="mt-1 max-w-sm text-sm leading-6 text-navy/50">
        {filtered
          ? "Try changing the status, date range, or customer search."
          : "New customer bookings will appear here as soon as they are created."}
      </p>
      {filtered && (
        <button
          type="button"
          onClick={onReset}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          <RotateCcw size={15} />
          Clear all filters
        </button>
      )}
    </div>
  );
}
