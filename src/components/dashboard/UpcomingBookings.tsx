// src/components/dashboard/UpcomingBookings.tsx
// Card list of the customer's next scheduled bookings.

import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { BookingStatusBadge } from "./BookingStatusBadge";
import type { DashboardBooking } from "@/hooks/useCustomerDashboard";

function refName(ref: DashboardBooking["serviceId"]): string {
  if (!ref || typeof ref === "string") return "Service";
  return ref.name ?? "Service";
}

function refAddress(ref: DashboardBooking["addressId"]): string {
  if (!ref || typeof ref === "string") return "";
  return [ref.label, [ref.area, ref.city].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join(" — ");
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

interface UpcomingBookingsProps {
  bookings: DashboardBooking[];
  loading?: boolean;
}

export function UpcomingBookings({ bookings, loading = false }: UpcomingBookingsProps) {
  return (
    <div className="rounded-card bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold text-navy">Upcoming Bookings</h3>
        <Link href="/bookings" className="text-sm font-medium text-primary hover:underline">
          View all
        </Link>
      </div>

      {loading && (
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-card bg-navy/5" />
          ))}
        </div>
      )}

      {!loading && bookings.length === 0 && (
        <div className="mt-4 rounded-card border border-dashed border-navy/15 bg-surface-soft p-6 text-center">
          <p className="text-sm text-navy/60">You have no upcoming bookings.</p>
          <Link href="/book" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
            Book a cleaning
          </Link>
        </div>
      )}

      {!loading && bookings.length > 0 && (
        <ul className="mt-4 space-y-3">
          {bookings.map((booking) => (
            <li
              key={booking._id}
              className="flex flex-col gap-2 rounded-card border border-navy/10 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-navy">{refName(booking.serviceId)}</p>
                  <BookingStatusBadge status={booking.status} />
                </div>
                <p className="flex items-center gap-1 text-xs text-navy/60">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(booking.bookingDate)} · {booking.startTime}–{booking.endTime}
                </p>
                {refAddress(booking.addressId) && (
                  <p className="flex items-center gap-1 text-xs text-navy/60">
                    <MapPin className="h-3.5 w-3.5" />
                    {refAddress(booking.addressId)}
                  </p>
                )}
              </div>
              <p className="font-heading text-sm font-semibold text-navy">
                ${booking.totalAmount.toFixed(2)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
