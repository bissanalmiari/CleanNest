// src/services/reportsService.ts
// Admin analytics: revenue, booking status breakdown, and popular services,
// all scoped to a shared date range. Uses MongoDB aggregation pipelines so
// the heavy lifting happens in the database, not in JS.

import "server-only";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import Service from "@/models/Service";
import type { BookingStatus } from "@/types/enums";

export type ReportRange = "week" | "month" | "year" | "all";

const ALL_BOOKING_STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
];

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns null for "all" (no lower bound). */
function getRangeStart(range: ReportRange): Date | null {
  const now = new Date();

  if (range === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return startOfDay(d);
  }
  if (range === "month") {
    const d = new Date(now);
    d.setDate(d.getDate() - 29);
    return startOfDay(d);
  }
  if (range === "year") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 11);
    d.setDate(1);
    return startOfDay(d);
  }
  return null; // "all"
}

function dateFormatForRange(range: ReportRange): string {
  return range === "year" || range === "all" ? "%Y-%m" : "%Y-%m-%d";
}

/* ------------------------------------------------------------------ */
/* 1) Revenue report                                                    */
/* ------------------------------------------------------------------ */

export interface RevenuePoint {
  date: string;
  revenue: number;
  count: number;
}

export interface RevenueReport {
  range: ReportRange;
  totalRevenue: number;
  transactionCount: number;
  averageTransactionValue: number;
  series: RevenuePoint[];
}

export async function getRevenueReport(range: ReportRange = "month"): Promise<RevenueReport> {
  await connectDB();

  const rangeStart = getRangeStart(range);
  const format = dateFormatForRange(range);

  const match: Record<string, unknown> = { status: "paid" };
  if (rangeStart) match.paidAt = { $gte: rangeStart };

  const [series, totals] = await Promise.all([
    Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format, date: "$paidAt" } },
          revenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
        },
      },
    ]),
  ]);

  const totalRevenue = totals[0]?.totalRevenue ?? 0;
  const transactionCount = totals[0]?.transactionCount ?? 0;

  return {
    range,
    totalRevenue,
    transactionCount,
    averageTransactionValue:
      transactionCount > 0 ? Math.round((totalRevenue / transactionCount) * 100) / 100 : 0,
    series: series.map((s: { _id: string; revenue: number; count: number }) => ({
      date: s._id,
      revenue: s.revenue,
      count: s.count,
    })),
  };
}

/* ------------------------------------------------------------------ */
/* 2) Booking report                                                    */
/* ------------------------------------------------------------------ */

export interface BookingReport {
  range: ReportRange;
  totalBookings: number;
  statusBreakdown: Record<BookingStatus, number>;
  completionRate: number; // percentage, 0-100
  series: { date: string; count: number }[];
}

export async function getBookingReport(range: ReportRange = "month"): Promise<BookingReport> {
  await connectDB();

  const rangeStart = getRangeStart(range);
  const format = dateFormatForRange(range);

  const match: Record<string, unknown> = {};
  if (rangeStart) match.bookingDate = { $gte: rangeStart };

  const [statusAgg, series] = await Promise.all([
    Booking.aggregate([{ $match: match }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format, date: "$bookingDate" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Ensure every status is present, even at zero, so the UI never has to
  // guess whether a missing key means "0" or "not loaded yet".
  const statusBreakdown = ALL_BOOKING_STATUSES.reduce(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    {} as Record<BookingStatus, number>
  );

  let totalBookings = 0;
  for (const row of statusAgg as { _id: BookingStatus; count: number }[]) {
    statusBreakdown[row._id] = row.count;
    totalBookings += row.count;
  }

  // Completion rate excludes cancelled bookings from the denominator,
  // since a cancelled booking was never a candidate for completion.
  const consideredBookings = totalBookings - statusBreakdown.cancelled;
  const completionRate =
    consideredBookings > 0
      ? Math.round((statusBreakdown.completed / consideredBookings) * 1000) / 10
      : 0;

  return {
    range,
    totalBookings,
    statusBreakdown,
    completionRate,
    series: (series as { _id: string; count: number }[]).map((s) => ({
      date: s._id,
      count: s.count,
    })),
  };
}

/* ------------------------------------------------------------------ */
/* 3) Popular services report                                          */
/* ------------------------------------------------------------------ */

export interface PopularServiceRow {
  serviceId: string;
  serviceName: string;
  category: string;
  bookingCount: number;
  revenue: number;
}

export async function getPopularServicesReport(
  range: ReportRange = "month",
  limit = 10
): Promise<PopularServiceRow[]> {
  await connectDB();

  const rangeStart = getRangeStart(range);
  const match: Record<string, unknown> = {};
  if (rangeStart) match.bookingDate = { $gte: rangeStart };

  const rows = await Booking.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$serviceId",
        bookingCount: { $sum: 1 },
        revenue: { $sum: "$totalAmount" },
      },
    },
    { $sort: { bookingCount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: Service.collection.name,
        localField: "_id",
        foreignField: "_id",
        as: "service",
      },
    },
  ]);

  return rows.map(
    (row: {
      _id: unknown;
      bookingCount: number;
      revenue: number;
      service?: Array<{ name?: string; category?: string }>;
    }) => ({
      serviceId: String(row._id),
      serviceName: row.service?.[0]?.name ?? "Unknown service",
      category: row.service?.[0]?.category ?? "—",
      bookingCount: row.bookingCount,
      revenue: row.revenue,
    })
  );
}
