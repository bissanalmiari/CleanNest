// src/components/dashboard/BookingReportsTable.tsx
// Filterable table of bookings for the admin dashboard "reports" section.

"use client";

interface BookingRow {
  _id: string;
  bookingNumber: string;
  bookingDate: string;
  status: string;
  totalAmount: number;
  customerId?: { name?: string; email?: string } | string;
  serviceId?: { name?: string } | string;
}

interface BookingReportFiltersState {
  from: string;
  to: string;
  status: string;
}

interface BookingReportsTableProps {
  bookings: BookingRow[];
  total: number;
  page: number;
  limit: number;
  filters: BookingReportFiltersState;
  onFiltersChange: (filters: BookingReportFiltersState) => void;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-status-pending/10 text-status-pending",
  confirmed: "bg-status-confirmed/10 text-status-confirmed",
  in_progress: "bg-status-inProgress/10 text-status-inProgress",
  completed: "bg-status-confirmed/10 text-status-confirmed",
  cancelled: "bg-status-cancelled/10 text-status-cancelled",
};

function customerLabel(customer: BookingRow["customerId"]): string {
  if (!customer || typeof customer === "string") return "—";
  return customer.name ?? customer.email ?? "—";
}

function serviceLabel(service: BookingRow["serviceId"]): string {
  if (!service || typeof service === "string") return "—";
  return service.name ?? "—";
}

export default function BookingReportsTable({
  bookings,
  total,
  page,
  limit,
  filters,
  onFiltersChange,
  onPageChange,
  loading = false,
}: BookingReportsTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="rounded-card bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-heading text-lg font-semibold text-navy">Booking Reports</h3>

        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            value={filters.from}
            onChange={(e) => onFiltersChange({ ...filters, from: e.target.value })}
            className="rounded-md border border-navy/10 px-2 py-1 text-sm text-navy"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(e) => onFiltersChange({ ...filters, to: e.target.value })}
            className="rounded-md border border-navy/10 px-2 py-1 text-sm text-navy"
          />
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
            className="rounded-md border border-navy/10 px-2 py-1 text-sm text-navy"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-navy/50">
              <th className="py-2 font-medium">Booking #</th>
              <th className="py-2 font-medium">Customer</th>
              <th className="py-2 font-medium">Service</th>
              <th className="py-2 font-medium">Date</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-navy/5">
                  <td colSpan={6} className="py-3">
                    <div className="h-4 w-full animate-pulse rounded bg-navy/5" />
                  </td>
                </tr>
              ))
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-navy/40">
                  No bookings match these filters
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr key={booking._id} className="border-b border-navy/5 text-navy">
                  <td className="py-3 font-medium">{booking.bookingNumber}</td>
                  <td className="py-3">{customerLabel(booking.customerId)}</td>
                  <td className="py-3">{serviceLabel(booking.serviceId)}</td>
                  <td className="py-3 text-navy/60">
                    {new Date(booking.bookingDate).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[booking.status] ?? "bg-navy/10 text-navy/60"
                      }`}
                    >
                      {booking.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 text-right font-medium">
                    ${booking.totalAmount.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-navy/60">
          <span>
            Page {page} of {totalPages} · {total} bookings
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded-md border border-navy/10 px-3 py-1 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded-md border border-navy/10 px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
