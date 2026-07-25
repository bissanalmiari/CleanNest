import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  DollarSign,
  MapPin,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";

import { BookingStatusBadge } from "./BookingStatusBadge";
import type { DashboardBooking } from "@/hooks/useCustomerDashboard";

function refName(ref: DashboardBooking["serviceId"]): string {
  if (!ref || typeof ref === "string") return "Cleaning service";
  return ref.name ?? "Cleaning service";
}

function refAddress(ref: DashboardBooking["addressId"]): string {
  if (!ref || typeof ref === "string") return "";
  return [ref.label, [ref.area, ref.city].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join(" · ");
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Beirut",
  });
}

interface UpcomingBookingsProps {
  bookings: DashboardBooking[];
  loading?: boolean;
}

export function UpcomingBookings({ bookings, loading = false }: UpcomingBookingsProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-white bg-white/95 shadow-[0_20px_65px_rgba(11,37,69,0.09)]">
      <div className="flex flex-col gap-4 border-b border-primary/10 bg-[linear-gradient(135deg,rgba(232,243,255,0.9),rgba(255,255,255,0.96))] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy text-cyan-300 shadow-[0_12px_30px_rgba(11,37,69,0.18)]">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">
              Arrival board
            </p>
            <h2 className="mt-2 font-heading text-2xl font-black tracking-[-0.03em] text-navy">
              Upcoming bookings
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Your next CleanNest visits, ready at a glance.
            </p>
          </div>
        </div>

        <Link
          href="/bookings"
          className="group inline-flex w-fit items-center gap-2 rounded-xl border border-primary/10 bg-white px-4 py-3 text-xs font-extrabold text-primary transition hover:border-primary/25"
        >
          View all routes
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="p-5 sm:p-6">
        {loading && (
          <div className="grid gap-4 lg:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-44 animate-pulse rounded-[1.5rem] border border-slate-100 bg-surface-soft"
              />
            ))}
          </div>
        )}

        {!loading && bookings.length === 0 && (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[1.6rem] border border-dashed border-primary/20 bg-primary-light/35 p-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-primary shadow-[0_12px_30px_rgba(30,111,217,0.12)]">
              <Sparkles className="h-7 w-7" />
            </span>
            <h3 className="mt-5 font-heading text-2xl font-black text-navy">
              Your schedule is open
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              Build a cleaning route and your next home visit will appear here.
            </p>
            <Link
              href="/book-service"
              className="mt-6 inline-flex min-h-12 items-center gap-3 rounded-xl bg-navy px-5 text-sm font-extrabold text-white"
            >
              Book a cleaning
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {!loading && bookings.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            {bookings.map((booking) => (
              <motion.article
                key={booking._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35 }}
                className="group relative overflow-hidden rounded-[1.55rem] border border-primary/10 bg-white p-5 shadow-[0_12px_35px_rgba(11,37,69,0.06)] transition hover:border-primary/25 hover:shadow-[0_18px_45px_rgba(11,37,69,0.1)]"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-cyan-400 to-emerald-400" />

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-[9px] font-extrabold uppercase tracking-[0.13em] text-primary/60">
                      {booking.bookingNumber}
                    </p>
                    <h3 className="mt-2 truncate font-heading text-xl font-black text-navy">
                      {refName(booking.serviceId)}
                    </h3>
                  </div>
                  <BookingStatusBadge status={booking.status} />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-surface-soft p-4">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <p className="mt-3 text-[9px] font-extrabold uppercase tracking-[0.11em] text-slate-400">
                      Date
                    </p>
                    <p className="mt-1 text-xs font-extrabold text-navy">
                      {formatDate(booking.bookingDate)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-surface-soft p-4">
                    <Clock3 className="h-4 w-4 text-cyan-600" />
                    <p className="mt-3 text-[9px] font-extrabold uppercase tracking-[0.11em] text-slate-400">
                      Time
                    </p>
                    <p className="mt-1 text-xs font-extrabold text-navy">
                      {booking.startTime} – {booking.endTime}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-end justify-between gap-4 border-t border-primary/10 pt-4">
                  <p className="flex min-w-0 items-start gap-2 text-xs font-medium leading-5 text-slate-500">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="line-clamp-2">
                      {refAddress(booking.addressId) || "Address confirmed"}
                    </span>
                  </p>
                  <span className="inline-flex shrink-0 items-center gap-1 text-sm font-black text-navy">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                    {booking.totalAmount.toFixed(2)}
                  </span>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
