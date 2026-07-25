// src/app/(admin)/admin-bookings/[id]/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";

/* ------------------------------------------------------------------ */
/* Types (shapes match what bookingManagementService returns as JSON)   */
/* ------------------------------------------------------------------ */

interface PopulatedRef {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
}

interface BookingDetail {
  _id: string;
  bookingNumber: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  totalAmount: number;
  customerNotes?: string;
  adminNotes?: string;
  customerId?: PopulatedRef;
  serviceId?: { _id: string; name: string; basePrice: number };
  addressId?: {
    city: string;
    area: string;
    street: string;
    building?: string;
    floor?: string;
    apartment?: string;
  };
  promoCodeId?: { code: string; discountType: string; discountValue: number };
}

interface BookingAddonRow {
  _id: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  addonId?: { name: string };
}

interface AssignmentRow {
  _id: string;
  status: string;
  assignedAt: string;
  cleanerId?: PopulatedRef;
  assignedByUserId?: { name: string };
}

interface StatusHistoryRow {
  _id: string;
  previousStatus?: string;
  newStatus: string;
  createdAt: string;
  changedByUserId?: { name: string };
}

interface AvailableCleaner {
  _id: string;
  name: string;
  email: string;
}

interface BookingDetailData {
  booking: BookingDetail;
  addons: BookingAddonRow[];
  assignments: AssignmentRow[];
  statusHistory: StatusHistoryRow[];
  availableCleaners: AvailableCleaner[];
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Must stay in sync with ALLOWED_TRANSITIONS in bookingManagementService.ts
const ALLOWED_NEXT_STATUSES: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function AdminBookingDetailPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const bookingId = params.bookingId;

  const [data, setData] = useState<BookingDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedCleanerId, setSelectedCleanerId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`);
      const json: ApiEnvelope<BookingDetailData> = await res.json();
      if (!json.success) {
        throw new Error(json.error ?? "Failed to load booking");
      }
      setData(json.data ?? null);
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to load booking"
      );
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleAssignCleaner = async () => {
    if (!selectedCleanerId) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cleanerId: selectedCleanerId }),
      });
      const json: ApiEnvelope<unknown> = await res.json();
      if (!json.success) {
        throw new Error(json.error ?? "Failed to assign cleaner");
      }
      setSelectedCleanerId("");
      await fetchDetail();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to assign cleaner"
      );
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus, note: statusNote || undefined }),
      });
      const json: ApiEnvelope<unknown> = await res.json();
      if (!json.success) {
        throw new Error(json.error ?? "Failed to update status");
      }
      setSelectedStatus("");
      setStatusNote("");
      await fetchDetail();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to update status"
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-soft p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="h-8 w-48 animate-pulse rounded bg-navy/10" />
          <div className="h-40 animate-pulse rounded-card bg-navy/5" />
          <div className="h-40 animate-pulse rounded-card bg-navy/5" />
        </div>
      </div>
    );
  }

  if (errorMessage && !data) {
    return (
      <div className="min-h-screen bg-surface-soft p-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-card bg-status-cancelled/10 px-4 py-3 text-sm text-status-cancelled">
            {errorMessage}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { booking, addons, assignments, statusHistory, availableCleaners } =
    data;
  const nextStatuses = ALLOWED_NEXT_STATUSES[booking.status] ?? [];

  return (
    <div className="min-h-screen bg-surface-soft p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <button
          type="button"
          onClick={() => router.push("/admin-bookings")}
          className="flex items-center gap-1 text-sm text-navy/60 hover:text-navy"
        >
          <ArrowLeft size={16} />
          Back to bookings
        </button>

        {errorMessage && (
          <div className="rounded-card bg-status-cancelled/10 px-4 py-3 text-sm text-status-cancelled">
            {errorMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between rounded-card bg-surface p-5 shadow-card">
          <div>
            <h1 className="font-heading text-xl font-semibold text-navy">
              Booking {booking.bookingNumber}
            </h1>
            <p className="mt-1 text-sm text-navy/60">
              {new Date(booking.bookingDate).toLocaleDateString()} ·{" "}
              {booking.startTime} - {booking.endTime}
            </p>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>

        {/* Customer / Service / Address / Amount */}
        <div className="grid grid-cols-1 gap-4 rounded-card bg-surface p-5 shadow-card sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-medium text-navy/50">Customer</h3>
            <p className="mt-1 font-medium text-navy">
              {booking.customerId?.name ?? "—"}
            </p>
            <p className="text-sm text-navy/60">
              {booking.customerId?.email} {booking.customerId?.phone}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-medium text-navy/50">Service</h3>
            <p className="mt-1 font-medium text-navy">
              {booking.serviceId?.name ?? "—"}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-medium text-navy/50">Address</h3>
            <p className="mt-1 text-sm text-navy">
              {[
                booking.addressId?.street,
                booking.addressId?.building,
                booking.addressId?.area,
                booking.addressId?.city,
              ]
                .filter(Boolean)
                .join(", ") || "—"}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-medium text-navy/50">Total Amount</h3>
            <p className="mt-1 font-heading text-lg font-semibold text-navy">
              ${booking.totalAmount.toLocaleString()}
            </p>
            {booking.promoCodeId && (
              <p className="text-xs text-navy/50">
                Promo: {booking.promoCodeId.code}
              </p>
            )}
          </div>

          {addons.length > 0 && (
            <div className="sm:col-span-2">
              <h3 className="text-xs font-medium text-navy/50">Add-ons</h3>
              <ul className="mt-1 space-y-1 text-sm text-navy">
                {addons.map((addon) => (
                  <li key={addon._id} className="flex justify-between">
                    <span>
                      {addon.addonId?.name ?? "Add-on"} × {addon.quantity}
                    </span>
                    <span className="text-navy/60">
                      ${addon.lineTotal.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Assign cleaner */}
        <div className="rounded-card bg-surface p-5 shadow-card">
          <h3 className="font-heading text-lg font-semibold text-navy">
            Assign Cleaner
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              value={selectedCleanerId}
              onChange={(e) => setSelectedCleanerId(e.target.value)}
              className="rounded-md border border-navy/10 px-3 py-2 text-sm text-navy"
            >
              <option value="">Select a cleaner...</option>
              {availableCleaners.map((cleaner) => (
                <option key={cleaner._id} value={cleaner._id}>
                  {cleaner.name} ({cleaner.email})
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selectedCleanerId || assigning}
              onClick={handleAssignCleaner}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {assigning ? "Assigning..." : "Assign"}
            </button>
          </div>

          {assignments.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm text-navy">
              {assignments.map((a) => (
                <li
                  key={a._id}
                  className="flex items-center justify-between border-t border-navy/5 pt-2"
                >
                  <span>
                    {a.cleanerId?.name ?? "Unknown cleaner"} — assigned by{" "}
                    {a.assignedByUserId?.name ?? "—"}
                  </span>
                  <span className="text-xs text-navy/50">
                    {new Date(a.assignedAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Update status */}
        <div className="rounded-card bg-surface p-5 shadow-card">
          <h3 className="font-heading text-lg font-semibold text-navy">
            Update Status
          </h3>

          {nextStatuses.length === 0 ? (
            <p className="mt-3 text-sm text-navy/50">
              This booking is in a final state and cannot be changed further.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSelectedStatus(status)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      selectedStatus === status
                        ? "bg-primary text-white"
                        : "bg-surface-soft text-navy/70 hover:text-navy"
                    }`}
                  >
                    {STATUS_LABELS[status] ?? status}
                  </button>
                ))}
              </div>

              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Optional note..."
                rows={2}
                className="w-full rounded-md border border-navy/10 px-3 py-2 text-sm text-navy"
              />

              <button
                type="button"
                disabled={!selectedStatus || updatingStatus}
                onClick={handleUpdateStatus}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {updatingStatus ? "Updating..." : "Confirm Status Change"}
              </button>
            </div>
          )}
        </div>

        {/* Status timeline */}
        <div className="rounded-card bg-surface p-5 shadow-card">
          <h3 className="font-heading text-lg font-semibold text-navy">
            Status History
          </h3>

          {statusHistory.length === 0 ? (
            <p className="mt-3 text-sm text-navy/40">No status changes yet</p>
          ) : (
            <ol className="mt-4 space-y-3 border-l-2 border-navy/10 pl-4">
              {statusHistory.map((entry) => (
                <li key={entry._id} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                  <p className="text-sm text-navy">
                    {entry.previousStatus
                      ? `${STATUS_LABELS[entry.previousStatus]} → `
                      : ""}
                    <span className="font-medium">
                      {STATUS_LABELS[entry.newStatus] ?? entry.newStatus}
                    </span>
                  </p>
                  <p className="text-xs text-navy/50">
                    {new Date(entry.createdAt).toLocaleString()} by{" "}
                    {entry.changedByUserId?.name ?? "—"}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
