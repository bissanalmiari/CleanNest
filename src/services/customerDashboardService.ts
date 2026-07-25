// src/services/customerDashboardService.ts
// Customer dashboard data-access layer: personal stats, upcoming bookings,
// and booking history for the logged-in customer. Mirrors the shape of
// dashboardService.ts (the admin equivalent) but every query is scoped to a
// single customerId — a customer must only ever see their own data.

import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
// These side-effect imports register the models required by populate().
// Keep them explicit so the production bundler cannot tree-shake them away.
import "@/models/Address";
import "@/models/Service";
import { reconcileElapsedBookings } from "@/services/bookingStatusAutomationService";

interface DashboardQueryOptions {
  skipReconciliation?: boolean;
}

async function prepareDashboardQuery(options: DashboardQueryOptions = {}) {
  await connectDB();

  if (!options.skipReconciliation) {
    await reconcileElapsedBookings();
  }
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/* ------------------------------------------------------------------ */
/* 1) Dashboard stats                                                   */
/* ------------------------------------------------------------------ */

export interface CustomerDashboardStats {
  upcomingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalBookings: number;
  totalSpent: number;
}

export async function getCustomerDashboardStats(
  customerId: string,
  options: DashboardQueryOptions = {},
): Promise<CustomerDashboardStats> {
  await prepareDashboardQuery(options);

  const todayStart = startOfDay(new Date());
  const customerObjectId = new mongoose.Types.ObjectId(customerId);
  const [summary] = await Booking.aggregate<{
    upcomingBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalBookings: number;
    totalSpent: number;
  }>([
    {
      $match: {
        customerId: customerObjectId,
      },
    },
    {
      $group: {
        _id: null,
        upcomingBookings: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $in: ["$status", ["pending", "confirmed", "in_progress"]] },
                  { $gte: ["$bookingDate", todayStart] },
                ],
              },
              1,
              0,
            ],
          },
        },
        completedBookings: {
          $sum: {
            $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
          },
        },
        cancelledBookings: {
          $sum: {
            $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0],
          },
        },
        totalBookings: { $sum: 1 },
        totalSpent: {
          $sum: {
            $cond: [
              { $eq: ["$paymentStatus", "paid"] },
              { $ifNull: ["$totalAmount", 0] },
              0,
            ],
          },
        },
      },
    },
  ]).exec();

  return {
    upcomingBookings: summary?.upcomingBookings ?? 0,
    completedBookings: summary?.completedBookings ?? 0,
    cancelledBookings: summary?.cancelledBookings ?? 0,
    totalBookings: summary?.totalBookings ?? 0,
    totalSpent: summary?.totalSpent ?? 0,
  };
}

/* ------------------------------------------------------------------ */
/* 2) Upcoming bookings                                                 */
/* ------------------------------------------------------------------ */

export async function getUpcomingBookings(
  customerId: string,
  limit = 5,
  options: DashboardQueryOptions = {},
) {
  await prepareDashboardQuery(options);

  const todayStart = startOfDay(new Date());

  const bookings = await Booking.find({
    customerId,
    status: { $in: ["pending", "confirmed", "in_progress"] },
    bookingDate: { $gte: todayStart },
  })
    .sort({ bookingDate: 1 })
    .limit(Math.min(50, Math.max(1, limit)))
    .populate([
      { path: "serviceId", select: "name price durationMinutes" },
      { path: "addressId", select: "label city area street" },
    ])
    .lean()
    .exec();

  return bookings;
}

/* ------------------------------------------------------------------ */
/* 3) Booking history (paginated)                                      */
/* ------------------------------------------------------------------ */

export interface BookingHistoryFilters {
  status?: string;
  page?: number;
  limit?: number;
}

export async function getBookingHistory(
  customerId: string,
  filters: BookingHistoryFilters = {},
  options: DashboardQueryOptions = {},
) {
  await prepareDashboardQuery(options);

  const { status, page = 1, limit = 10 } = filters;

  const match: Record<string, unknown> = { customerId };
  if (status) match.status = status;

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(50, Math.max(1, limit));

  const [bookings, total] = await Promise.all([
    Booking.find(match)
      .sort({ bookingDate: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .populate([
        { path: "serviceId", select: "name price durationMinutes" },
        { path: "addressId", select: "label city area street" },
      ])
      .lean()
      .exec(),
    Booking.countDocuments(match),
  ]);

  return {
    bookings,
    total,
    page: safePage,
    limit: safeLimit,
  };
}

export async function getCustomerDashboardOverview(
  customerId: string,
  {
    upcomingLimit = 5,
    historyPage = 1,
    historyLimit = 10,
    historyStatus,
  }: {
    upcomingLimit?: number;
    historyPage?: number;
    historyLimit?: number;
    historyStatus?: string;
  } = {},
) {
  await prepareDashboardQuery();

  const sharedOptions: DashboardQueryOptions = {
    skipReconciliation: true,
  };

  const [stats, upcoming, history] = await Promise.all([
    getCustomerDashboardStats(customerId, sharedOptions),
    getUpcomingBookings(customerId, upcomingLimit, sharedOptions),
    getBookingHistory(
      customerId,
      {
        status: historyStatus,
        page: historyPage,
        limit: historyLimit,
      },
      sharedOptions,
    ),
  ]);

  return {
    stats,
    upcoming,
    history,
  };
}
