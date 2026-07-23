// src/services/bookingManagementService.ts
// Admin booking-management data-access layer: list, detail, cleaner assignment,
// and status transitions. Every write here also appends a BookingStatusHistory
// entry so the audit trail stays complete.

import "server-only";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import BookingAddon from "@/models/BookingAddOn";
import CleanerAssignment from "@/models/CleanerAssignment";
import BookingStatusHistory from "@/models/BookingStatusHistory";
import User from "@/models/User";
import { AppError, NotFoundError } from "@/lib/apiError";
import type { BookingStatus } from "@/types/enums";

/* ------------------------------------------------------------------ */
/* Allowed status transitions                                          */
/* ------------------------------------------------------------------ */
// Single source of truth for which status a booking may move to next.
// Keep the frontend's copy (admin-bookings detail page) in sync with this.
const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function getAllowedNextStatuses(
  currentStatus: BookingStatus
): BookingStatus[] {
  return ALLOWED_TRANSITIONS[currentStatus] ?? [];
}

/* ------------------------------------------------------------------ */
/* 1) List bookings (filterable + paginated)                           */
/* ------------------------------------------------------------------ */

export interface BookingListFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
  serviceId?: string;
  search?: string; // matches customer name
  page?: number;
  limit?: number;
}

export async function getAllBookings(filters: BookingListFilters = {}) {
  await connectDB();

  const {
    status,
    dateFrom,
    dateTo,
    customerId,
    serviceId,
    search,
    page = 1,
    limit = 20,
  } = filters;

  const match: Record<string, unknown> = {};

  if (status) match.status = status;
  if (serviceId) match.serviceId = serviceId;

  if (dateFrom || dateTo) {
    const bookingDate: Record<string, Date> = {};
    if (dateFrom) bookingDate.$gte = new Date(dateFrom);
    if (dateTo) bookingDate.$lte = new Date(dateTo);
    match.bookingDate = bookingDate;
  }

  // Searching by customer name requires resolving matching user ids first,
  // since customerId is stored as a reference rather than embedded text.
  if (search) {
    const matchingUsers = await User.find({
      role: "customer",
      name: { $regex: search, $options: "i" },
    })
      .select("_id")
      .lean()
      .exec();

    match.customerId = { $in: matchingUsers.map((u) => u._id) };
  } else if (customerId) {
    match.customerId = customerId;
  }

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));

  const [bookings, total] = await Promise.all([
    Booking.find(match)
      .sort({ bookingDate: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .populate("customerId", "name email phone")
      .populate("serviceId", "name")
      .populate("addressId", "city area street")
      .lean()
      .exec(),
    Booking.countDocuments(match),
  ]);

  return { bookings, total, page: safePage, limit: safeLimit };
}

/* ------------------------------------------------------------------ */
/* 2) Booking detail                                                    */
/* ------------------------------------------------------------------ */

export async function getBookingById(id: string) {
  await connectDB();

  const [booking, addons, assignments, statusHistory, availableCleaners] =
    await Promise.all([
      Booking.findById(id)
        .populate("customerId", "name email phone")
        .populate("serviceId", "name category basePrice baseDurationMinutes")
        .populate("addressId", "city area street building floor apartment")
        .populate("promoCodeId", "code discountType discountValue")
        .lean()
        .exec(),
      BookingAddon.find({ bookingId: id })
        .populate("addonId", "name")
        .lean()
        .exec(),
      CleanerAssignment.find({ bookingId: id })
        .sort({ assignedAt: -1 })
        .populate("cleanerId", "name email phone")
        .populate("assignedByUserId", "name")
        .lean()
        .exec(),
      BookingStatusHistory.find({ bookingId: id })
        .sort({ createdAt: -1 })
        .populate("changedByUserId", "name")
        .lean()
        .exec(),
      User.find({ role: "cleaner", status: "active" })
        .select("name email phone")
        .sort({ name: 1 })
        .lean()
        .exec(),
    ]);

  if (!booking) {
    throw new NotFoundError("Booking not found");
  }

  return { booking, addons, assignments, statusHistory, availableCleaners };
}

/* ------------------------------------------------------------------ */
/* 3) Assign a cleaner                                                  */
/* ------------------------------------------------------------------ */

export async function assignCleaner(
  bookingId: string,
  cleanerId: string,
  assignedByUserId: string
) {
  await connectDB();

  const [booking, cleaner] = await Promise.all([
    Booking.findById(bookingId),
    User.findById(cleanerId),
  ]);

  if (!booking) {
    throw new NotFoundError("Booking not found");
  }

  if (!cleaner || cleaner.role !== "cleaner") {
    throw new AppError("Selected user is not a cleaner", 422);
  }

  const assignment = await CleanerAssignment.create({
    bookingId,
    cleanerId,
    assignedByUserId,
    status: "assigned",
  });

  // A fresh assignment on a still-pending booking implicitly confirms it.
  if (booking.status === "pending") {
    const previousStatus = booking.status;
    booking.status = "confirmed";
    await booking.save();

    await BookingStatusHistory.create({
      bookingId,
      previousStatus,
      newStatus: "confirmed",
      changedByUserId: assignedByUserId,
    });
  }

  return assignment.toObject();
}

/* ------------------------------------------------------------------ */
/* 4) Change booking status                                             */
/* ------------------------------------------------------------------ */

export async function changeBookingStatus(
  bookingId: string,
  newStatus: BookingStatus,
  changedByUserId: string,
  note?: string
) {
  await connectDB();

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new NotFoundError("Booking not found");
  }

  const currentStatus = booking.status as BookingStatus;
  const allowedNext = getAllowedNextStatuses(currentStatus);

  if (!allowedNext.includes(newStatus)) {
    throw new AppError(
      `Cannot change status from "${currentStatus}" to "${newStatus}"`,
      422
    );
  }

  booking.status = newStatus;
  if (note) {
    booking.adminNotes = booking.adminNotes
      ? `${booking.adminNotes}\n${note}`
      : note;
  }
  await booking.save();

  await BookingStatusHistory.create({
    bookingId,
    previousStatus: currentStatus,
    newStatus,
    changedByUserId,
  });

  return booking.toObject();
}
