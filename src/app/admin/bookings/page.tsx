// src/app/(admin)/admin-bookings/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Calendar,
  User,
  Sparkles,
  Wallet,
  ClipboardList,
} from "lucide-react";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";

interface BookingRow {
  _id: string;
  bookingNumber: string;
  bookingDate: string;
  status: string;
  totalAmount: number;
  customerId?: { name?: string } | string | null;
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
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function customerName(customer: BookingRow["customerId"]): string {
  if (!customer || typeof customer === "string") return "—";
  return customer.name ?? "—";
}

function serviceName(service: BookingRow["serviceId"]): string {
  if (!service || typeof service === "string") return "—";
  return service.name ?? "—";
}

function initials(name: string): string {
  if (name === "—") return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

const ROW_ACCENT: Record<string, string> = {
  pending: "border-l-status-pending",
  confirmed: "border-l-status-confirmed",
  in_progress: "border-l-status-inProgress",
  completed: "border-l-status-confirmed",
  cancelled: "border-l-status-cancelled",
};

export default function AdminBookingsPage() {
  const router = useRouter();

  const [filters, setFilters] = useState<FiltersState>(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<BookingListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchBookings = useCallback(
    async (currentFilters: FiltersState, currentPage: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(currentPage) });
        if (currentFilters.status) params.set("status", currentFilters.status);
        if (currentFilters.dateFrom)
          params.set("dateFrom", currentFilters.dateFrom);
        if (currentFilters.dateTo) params.set("dateTo", currentFilters.dateTo);
        if (currentFilters.search) params.set("search", currentFilters.search);

        const res = await fetch(`/api/admin/bookings?${params.toString()}`);
        const json: ApiEnvelope<BookingListData> = await res.json();

        if (!json.success) {
          throw new Error(json.error ?? "Failed to load bookings");
        }
        setData(json.data ?? null);
        setErrorMessage(null);
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load bookings"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchBookings(filters, page);
  }, [filters, page, fetchBookings]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const handleFilterChange = (patch: Partial<FiltersState>) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="min-h-screen bg-surface-soft p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-light text-primary">
            <ClipboardList size={20} />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-semibold text-navy">
              Booking Management
            </h1>
            <p className="text-sm text-navy/60">
              View, filter, and manage every booking in the system.
            </p>
          </div>
          {data && !loading && (
            <span className="ml-auto rounded-full bg-primary-light px-3 py-1 text-sm font-medium text-primary">
              {data.total} total
            </span>
          )}
        </div>

        {errorMessage && (
          <div className="rounded-card bg-status-cancelled/10 px-4 py-3 text-sm text-status-cancelled">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 rounded-card bg-surface p-4 shadow-card">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40" />
            <input
              type="text"
              placeholder="Search by customer name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-md border border-navy/10 py-2 pl-9 pr-3 text-sm text-navy transition-colors focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 rounded-md border border-navy/10 px-2 py-1.5">
            <Calendar size={15} className="text-navy/40" />
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange({ dateFrom: e.target.value })}
              className="text-sm text-navy focus:outline-none"
            />
            <span className="text-navy/30">–</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange({ dateTo: e.target.value })}
              className="text-sm text-navy focus:outline-none"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange({ status: e.target.value })}
            className="rounded-md border border-navy/10 px-3 py-2 text-sm text-navy focus:border-primary focus:outline-none"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-card bg-surface p-5 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-navy/10 text-xs uppercase tracking-wide text-navy/40">
                  <th className="py-3 font-medium">Booking #</th>
                  <th className="py-3 font-medium">
                    <span className="flex items-center gap-1.5">
                      <User size={13} /> Customer
                    </span>
                  </th>
                  <th className="py-3 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={13} /> Service
                    </span>
                  </th>
                  <th className="py-3 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} /> Date
                    </span>
                  </th>
                  <th className="py-3 font-medium">Status</th>
                  <th className="py-3 text-right font-medium">
                    <span className="flex items-center justify-end gap-1.5">
                      <Wallet size={13} /> Amount
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-navy/5">
                      <td colSpan={6} className="py-3.5">
                        <div className="h-4 w-full animate-pulse rounded bg-navy/5" />
                      </td>
                    </tr>
                  ))
                ) : !data || data.bookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-navy/40">
                        <ClipboardList size={28} className="text-navy/20" />
                        <span>No bookings match these filters</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.bookings.map((booking) => {
                    const name = customerName(booking.customerId);
                    return (
                      <tr
                        key={booking._id}
                        onClick={() =>
                          router.push(`/admin-bookings/${booking._id}`)
                        }
                        className={`cursor-pointer border-b border-l-4 border-navy/5 text-navy transition-colors hover:bg-surface-soft ${
                          ROW_ACCENT[booking.status] ?? "border-l-transparent"
                        }`}
                      >
                        <td className="py-3.5 font-medium">
                          {booking.bookingNumber}
                        </td>
                        <td className="py-3.5">
                          <span className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-light text-xs font-semibold text-primary">
                              {initials(name)}
                            </span>
                            {name}
                          </span>
                        </td>
                        <td className="py-3.5 text-navy/70">
                          {serviceName(booking.serviceId)}
                        </td>
                        <td className="py-3.5 text-navy/60">
                          {new Date(booking.bookingDate).toLocaleDateString()}
                        </td>
                        <td className="py-3.5">
                          <BookingStatusBadge status={booking.status} />
                        </td>
                        <td className="py-3.5 text-right font-semibold">
                          ${booking.totalAmount.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {data && totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-navy/60">
              <span>
                Page {data.page} of {totalPages} · {data.total} bookings
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-md border border-navy/10 px-3 py-1 transition-colors hover:bg-surface-soft disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-md border border-navy/10 px-3 py-1 transition-colors hover:bg-surface-soft disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}