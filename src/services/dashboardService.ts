// src/services/dashboardService.ts
// Admin dashboard data-access layer: stats, revenue, and booking reports.
// Uses MongoDB aggregation pipelines so the heavy lifting happens in the DB, not in JS.

import "server-only";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import Review from "@/models/Review";
import User from "@/models/User";
import Service from "@/models/Service"; // imported for populate() model registration

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/* ------------------------------------------------------------------ */
/* 1) Dashboard overview stats                                         */
/* ------------------------------------------------------------------ */

export interface DashboardStats {
  todaysBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalCustomers: number;
  averageRating: number;
  reviewCount: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await connectDB();

  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  const [
    todaysBookings,
    upcomingBookings,
    completedBookings,
    cancelledBookings,
    totalCustomers,
    ratingAgg,
  ] = await Promise.all([
    Booking.countDocuments({
      bookingDate: { $gte: todayStart, $lte: todayEnd },
    }),
    Booking.countDocuments({
      status: { $in: ["pending", "confirmed"] },
      bookingDate: { $gt: todayEnd },
    }),
    Booking.countDocuments({ status: "completed" }),
    Booking.countDocuments({ status: "cancelled" }),
    User.countDocuments({ role: "customer" }),
    Review.aggregate([
      { $match: { isVisible: true } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const averageRating = ratingAgg[0]?.avgRating ?? 0;
  const reviewCount = ratingAgg[0]?.count ?? 0;

  return {
    todaysBookings,
    upcomingBookings,
    completedBookings,
    cancelledBookings,
    totalCustomers,
    averageRating: Math.round(averageRating * 10) / 10,
    reviewCount,
  };
}

/* ------------------------------------------------------------------ */
/* 2) Revenue stats (for the chart)                                    */
/* ------------------------------------------------------------------ */

export type RevenueRange = "week" | "month" | "year";

export interface RevenuePoint {
  date: string; // "YYYY-MM-DD" for week/month, "YYYY-MM" for year
  revenue: number;
  count: number;
}

export interface RevenueStats {
  range: RevenueRange;
  totalRevenue: number;
  averageBookingValue: number;
  series: RevenuePoint[];
}

function getRangeStart(range: RevenueRange): Date {
  const now = new Date();

  if (range === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6); // last 7 days including today
    return startOfDay(d);
  }

  if (range === "month") {
    const d = new Date(now);
    d.setDate(d.getDate() - 29); // last 30 days including today
    return startOfDay(d);
  }

  // year: last 12 months
  const d = new Date(now);
  d.setMonth(d.getMonth() - 11);
  d.setDate(1);
  return startOfDay(d);
}

function dateFormatForRange(range: RevenueRange): string {
  return range === "year" ? "%Y-%m" : "%Y-%m-%d";
}

export async function getRevenueStats(range: RevenueRange = "week"): Promise<RevenueStats> {
  await connectDB();

  const rangeStart = getRangeStart(range);
  const format = dateFormatForRange(range);

  const series = await Payment.aggregate([
    { $match: { status: "paid", paidAt: { $gte: rangeStart } } },
    {
      $group: {
        _id: { $dateToString: { format, date: "$paidAt" } },
        revenue: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const totalRevenue = series.reduce((total, point) => total + Number(point.revenue ?? 0), 0);
  const totalPayments = series.reduce((total, point) => total + Number(point.count ?? 0), 0);
  const averageBookingValue = totalPayments > 0 ? totalRevenue / totalPayments : 0;

  return {
    range,
    totalRevenue,
    averageBookingValue: Math.round(averageBookingValue * 100) / 100,
    series: series.map((s) => ({
      date: s._id as string,
      revenue: s.revenue as number,
      count: s.count as number,
    })),
  };
}

/* ------------------------------------------------------------------ */
/* 3) Booking reports (filterable table + breakdowns)                  */
/* ------------------------------------------------------------------ */

export interface BookingReportFilters {
  from?: string; // ISO date string
  to?: string; // ISO date string
  status?: string;
  serviceId?: string;
  page?: number;
  limit?: number;
}

export async function getBookingReports(filters: BookingReportFilters = {}) {
  await connectDB();

  const { from, to, status, serviceId, page = 1, limit = 20 } = filters;

  const match: Record<string, unknown> = {};

  if (from || to) {
    const bookingDate: Record<string, Date> = {};
    if (from) bookingDate.$gte = new Date(from);
    if (to) bookingDate.$lte = new Date(to);
    match.bookingDate = bookingDate;
  }

  if (status) match.status = status;
  if (serviceId) match.serviceId = serviceId;

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));

  const [bookings, total, statusBreakdownAgg, serviceBreakdownAgg] = await Promise.all([
    Booking.find(match)
      .sort({ bookingDate: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .populate("customerId", "name email")
      .populate("serviceId", "name")
      .lean()
      .exec(),
    Booking.countDocuments(match),
    Booking.aggregate([{ $match: match }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$serviceId",
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      {
        $lookup: {
          from: Service.collection.name,
          localField: "_id",
          foreignField: "_id",
          as: "service",
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  return {
    bookings,
    total,
    page: safePage,
    limit: safeLimit,
    statusBreakdown: statusBreakdownAgg.map((s: { _id: string; count: number }) => ({
      status: s._id,
      count: s.count,
    })),
    serviceBreakdown: serviceBreakdownAgg.map(
      (s: {
        _id: unknown;
        count: number;
        revenue: number;
        service?: Array<{ name?: string }>;
      }) => ({
        serviceId: s._id?.toString() ?? null,
        serviceName: s.service?.[0]?.name ?? "Unknown",
        count: s.count,
        revenue: s.revenue,
      })
    ),
  };
}

/**
 * Initial admin dashboard payload. Keeping this as one authenticated request
 * avoids three separate session checks and lets MongoDB run the independent
 * dashboard queries concurrently.
 */
export async function getDashboardOverview({
  range = "week",
  reportFilters = {},
}: {
  range?: RevenueRange;
  reportFilters?: BookingReportFilters;
} = {}) {
  const [stats, revenue, reports] = await Promise.all([
    getDashboardStats(),
    getRevenueStats(range),
    getBookingReports(reportFilters),
  ]);

  return {
    stats,
    revenue,
    reports,
  };
}
