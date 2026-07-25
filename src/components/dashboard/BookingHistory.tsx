import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  History,
  ReceiptText,
  SlidersHorizontal,
} from "lucide-react";
import { motion } from "motion/react";

import { BookingStatusBadge } from "./BookingStatusBadge";
import type { DashboardBooking } from "@/hooks/useCustomerDashboard";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Approved" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function refName(ref: DashboardBooking["serviceId"]): string {
  if (!ref || typeof ref === "string") return "Cleaning service";
  return ref.name ?? "Cleaning service";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Beirut",
  });
}

interface BookingHistoryProps {
  bookings: DashboardBooking[];
  total: number;
  page: number;
  limit: number;
  status: string;
  onStatusChange: (status: string) => void;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export function BookingHistory({
  bookings,
  total,
  page,
  limit,
  status,
  onStatusChange,
  onPageChange,
  loading = false,
}: BookingHistoryProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white bg-white/95 shadow-[0_20px_65px_rgba(11,37,69,0.09)]">
      <div className="flex flex-col gap-4 border-b border-primary/10 bg-[linear-gradient(135deg,rgba(232,243,255,0.9),rgba(255,255,255,0.96))] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary">
            <History className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">
              Route archive
            </p>
            <h2 className="mt-2 font-heading text-2xl font-black tracking-[-0.03em] text-navy">
              Booking history
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              A complete record of your CleanNest activity.
            </p>
          </div>
        </div>

        <label className="relative w-full sm:w-auto">
          <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            className="min-h-11 w-full appearance-none rounded-xl border border-primary/10 bg-white py-2 pl-10 pr-9 text-xs font-extrabold text-navy outline-none transition focus:border-primary/30 focus:ring-4 focus:ring-primary/10 sm:min-w-[175px]"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="p-4 sm:p-6">
        <div className="overflow-x-auto rounded-[1.4rem] border border-primary/10">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-surface-soft">
              <tr className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-slate-400">
                <th className="px-5 py-4">Booking route</th>
                <th className="px-5 py-4">Service</th>
                <th className="px-5 py-4">Cleaning date</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                [1, 2, 3].map((item) => (
                  <tr key={item}>
                    <td colSpan={5} className="px-5 py-3">
                      <div className="h-12 animate-pulse rounded-xl bg-navy/5" />
                    </td>
                  </tr>
                ))}

              {!loading && bookings.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary">
                      <ReceiptText className="h-6 w-6" />
                    </span>
                    <p className="mt-4 font-heading text-lg font-black text-navy">
                      No matching bookings
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Try another status filter to see more activity.
                    </p>
                  </td>
                </tr>
              )}

              {!loading &&
                bookings.map((booking) => (
                  <motion.tr
                    key={booking._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-primary/10 transition hover:bg-primary/[0.025]"
                  >
                    <td className="px-5 py-4">
                      <p className="font-mono text-[10px] font-extrabold uppercase tracking-[0.1em] text-primary">
                        {booking.bookingNumber}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-extrabold text-navy">{refName(booking.serviceId)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5 text-primary" />
                        {formatDate(booking.bookingDate)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <BookingStatusBadge status={booking.status} />
                    </td>
                    <td className="px-5 py-4 text-right font-heading text-sm font-black text-navy">
                      ${booking.totalAmount.toFixed(2)}
                    </td>
                  </motion.tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-surface-soft p-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold">
            Page <strong className="text-navy">{page}</strong> of{" "}
            <strong className="text-navy">{totalPages}</strong> · {total} total routes
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Previous booking history page"
              disabled={page <= 1 || loading}
              onClick={() => onPageChange(page - 1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/10 bg-white text-primary transition hover:border-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next booking history page"
              disabled={page >= totalPages || loading}
              onClick={() => onPageChange(page + 1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/10 bg-white text-primary transition hover:border-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
