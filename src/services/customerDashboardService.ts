// src/services/customerDashboardService.ts
// Customer dashboard data-access layer: personal stats, upcoming bookings,
// and booking history for the logged-in customer. Mirrors the shape of
// dashboardService.ts (the admin equivalent) but every query is scoped to a
// single customerId — a customer must only ever see their own data.

import "server-only";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Address from "@/models/Address"; // imported for populate() model registration
import Service from "@/models/Service"; // imported for populate() model registration

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
  customerId: string
): Promise<CustomerDashboardStats> {
  await connectDB();

  const todayStart = startOfDay(new Date());

  const [
    upcomingBookings,
    completedBookings,
    cancelledBookings,
    totalBookings,
    spentAgg,
  ] = await Promise.all([
    Booking.countDocuments({
      customerId,
      status: { $in: ["pending", "confirmed", "in_progress"] },
      bookingDate: { $gte: todayStart },
    }),
    Booking.countDocuments({ customerId, status: "completed" }),
    Booking.countDocuments({ customerId, status: "cancelled" }),
    Booking.countDocuments({ customerId }),
    Booking.aggregate([
      { $match: { customerId: new mongoose.Types.ObjectId(customerId), paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
  ]);

  return {
    upcomingBookings,
    completedBookings,
    cancelledBookings,
    totalBookings,
    totalSpent: spentAgg[0]?.total ?? 0,
  };
}

/* ------------------------------------------------------------------ */
/* 2) Upcoming bookings                                                 */
/* ------------------------------------------------------------------ */

export async function getUpcomingBookings(customerId: string, limit = 5) {
  await connectDB();

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
  filters: BookingHistoryFilters = {}
) {
  await connectDB();

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