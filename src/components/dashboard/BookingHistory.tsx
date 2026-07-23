// src/components/dashboard/BookingHistory.tsx
// Paginated table of the customer's past bookings, with a status filter.

import { ChevronLeft, ChevronRight } from "lucide-react";
import { BookingStatusBadge } from "./BookingStatusBadge";
import type { DashboardBooking } from "@/hooks/useCustomerDashboard";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function refName(ref: DashboardBooking["serviceId"]): string {
  if (!ref || typeof ref === "string") return "—";
  return ref.name ?? "—";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
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
    <div className="rounded-card bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-heading text-lg font-semibold text-navy">Booking History</h3>

        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-lg border border-navy/15 bg-surface px-3 py-1.5 text-sm text-navy focus:border-primary focus:outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-xs uppercase tracking-wide text-navy/50">
              <th className="pb-2 font-medium">Booking #</th>
              <th className="pb-2 font-medium">Service</th>
              <th className="pb-2 font-medium">Date</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 pr-0 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              [1, 2, 3].map((i) => (
                <tr key={i}>
                  <td colSpan={5} className="py-2">
                    <div className="h-8 animate-pulse rounded-lg bg-navy/5" />
                  </td>
                </tr>
              ))}

            {!loading && bookings.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-navy/50">
                  No bookings found.
                </td>
              </tr>
            )}

            {!loading &&
              bookings.map((booking) => (
                <tr key={booking._id} className="border-b border-navy/5 last:border-0">
                  <td className="py-3 font-medium text-navy">{booking.bookingNumber}</td>
                  <td className="py-3 text-navy/70">{refName(booking.serviceId)}</td>
                  <td className="py-3 text-navy/70">{formatDate(booking.bookingDate)}</td>
                  <td className="py-3">
                    <BookingStatusBadge status={booking.status} />
                  </td>
                  <td className="py-3 text-right font-medium text-navy">
                    ${booking.totalAmount.toFixed(2)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-navy/60">
        <span>
          Page {page} of {totalPages} · {total} total
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(page - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-navy/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => onPageChange(page + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-navy/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
