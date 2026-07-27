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
// Register every model referenced by populate(). Side-effect imports are
// intentional so production tree-shaking cannot remove model registration.
import "@/models/Address";
import "@/models/Service";
import "@/models/PromoCode";
import "@/models/AddOn";
import { AppError, NotFoundError } from "@/lib/apiError";
import { reconcileElapsedBookings } from "@/services/bookingStatusAutomationService";
import type { BookingStatus } from "@/types/enums";
import { createNotification, createNotifications } from "@/services/notificationService";

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

export function getAllowedNextStatuses(currentStatus: BookingStatus): BookingStatus[] {
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
  await reconcileElapsedBookings();

  const { status, dateFrom, dateTo, customerId, serviceId, search, page = 1, limit = 20 } = filters;

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
  await reconcileElapsedBookings();

  const [booking, addons, assignments, statusHistory, availableCleaners] = await Promise.all([
    Booking.findById(id)
      .populate("customerId", "name email phone")
      .populate("serviceId", "name category price durationMinutes")
      .populate("addressId", "city area street building floor apartment")
      .populate("promoCodeId", "code discountType discountValue")
      .lean()
      .exec(),
    BookingAddon.find({ bookingId: id }).populate("addonId", "name").lean().exec(),
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

export async function assignCleaners(
  bookingId: string,
  cleanerIds: string[],
  assignedByUserId: string
) {
  await connectDB();

  const uniqueCleanerIds = [...new Set(cleanerIds.filter(Boolean))];
  if (uniqueCleanerIds.length === 0) {
    throw new AppError("Select at least one cleaner", 422);
  }

  const [booking, cleaners, existingAssignments] = await Promise.all([
    Booking.findById(bookingId),
    User.find({
      _id: { $in: uniqueCleanerIds },
      role: "cleaner",
      status: "active",
    })
      .select("_id name")
      .lean()
      .exec(),
    CleanerAssignment.find({
      bookingId,
      cleanerId: { $in: uniqueCleanerIds },
    })
      .select("cleanerId")
      .lean()
      .exec(),
  ]);

  if (!booking) {
    throw new NotFoundError("Booking not found");
  }

  if (["completed", "cancelled"].includes(booking.status)) {
    throw new AppError("Cleaners cannot be assigned to a closed booking", 422);
  }

  if (cleaners.length !== uniqueCleanerIds.length) {
    throw new AppError("One or more selected cleaners are unavailable", 422);
  }

  const existingIds = new Set(
    existingAssignments.map((assignment) => String(assignment.cleanerId))
  );
  const newCleanerIds = uniqueCleanerIds.filter((id) => !existingIds.has(id));

  if (newCleanerIds.length === 0) {
    throw new AppError("The selected cleaners are already assigned", 409);
  }

  // A fresh assignment on a still-pending booking implicitly confirms it —
  // but not for an unpaid card booking; payment must clear first.
  if (booking.status === "pending") {
    if (booking.paymentMethod === "card" && booking.paymentStatus !== "paid") {
      throw new AppError(
        "This booking is paid by card and cannot be confirmed until the customer completes payment.",
        409
      );
    }

    const previousStatus = booking.status;
    booking.status = "confirmed";
    await booking.save();

    await BookingStatusHistory.create({
      bookingId,
      previousStatus,
      newStatus: "confirmed",
      changedByUserId: assignedByUserId,
      reason: "Booking confirmed when cleaners were assigned.",
    });
  }

  const assignments = await CleanerAssignment.insertMany(
    newCleanerIds.map((cleanerId) => ({
      bookingId,
      cleanerId,
      assignedByUserId,
      status: "assigned",
    }))
  );

  await createNotifications(
    newCleanerIds.map((cleanerId) => ({
      userId: cleanerId,
      type: "assignment_new" as const,
      title: "New cleaning assignment",
      message: `You were assigned to booking ${booking.bookingNumber}. Review the job and respond.`,
      href: `/cleaner/jobs/${bookingId}`,
      bookingId,
      dedupeKey: `assignment-new:${bookingId}:${cleanerId}`,
      email: true,
    }))
  ).catch((error) => console.error("[notification:assignment-new]", error));

  await createNotification({
    userId: booking.customerId.toString(),
    type: "cleaner_assigned",
    title: "Your booking has been approved",
    message: `${newCleanerIds.length === 1 ? "A cleaner has" : "Your cleaning team has"} been assigned to booking ${booking.bookingNumber}.`,
    href: "/bookings",
    bookingId,
    dedupeKey: `cleaner-assigned:${bookingId}`,
    email: true,
  }).catch((error) => console.error("[notification:cleaner-assigned]", error));

  return assignments.map((assignment) => assignment.toObject());
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
    throw new AppError(`Cannot change status from "${currentStatus}" to "${newStatus}"`, 422);
  }

  if (
    newStatus === "confirmed" &&
    booking.paymentMethod === "card" &&
    booking.paymentStatus !== "paid"
  ) {
    throw new AppError(
      "This booking is paid by card and cannot be confirmed until the customer completes payment.",
      409
    );
  }

  if (currentStatus === "pending" && newStatus === "confirmed") {
    const assignedCleanerCount = await CleanerAssignment.countDocuments({
      bookingId,
      status: { $in: ["assigned", "accepted"] },
    });
    if (assignedCleanerCount === 0) {
      throw new AppError("Assign at least one cleaner before approving this booking", 422);
    }
  }

  booking.status = newStatus;
  if (note) {
    booking.adminNotes = booking.adminNotes ? `${booking.adminNotes}\n${note}` : note;
  }
  await booking.save();

  await BookingStatusHistory.create({
    bookingId,
    previousStatus: currentStatus,
    newStatus,
    changedByUserId,
    reason: note ?? "",
  });

  if (newStatus === "confirmed") {
    await createNotification({
      userId: booking.customerId.toString(),
      type: "booking_confirmed",
      title: "Your booking is approved",
      message: `Booking ${booking.bookingNumber} is officially scheduled.`,
      href: "/bookings",
      bookingId,
      dedupeKey: `booking-confirmed:${bookingId}`,
      email: true,
    }).catch((error) => console.error("[notification:booking-confirmed]", error));
  } else if (newStatus === "cancelled") {
    await createNotification({
      userId: booking.customerId.toString(),
      type: "booking_cancelled",
      title: "Your booking was cancelled",
      message: `Booking ${booking.bookingNumber} has been cancelled.`,
      href: "/bookings",
      bookingId,
      dedupeKey: `booking-cancelled:${bookingId}`,
      email: true,
    }).catch((error) => console.error("[notification:booking-cancelled]", error));
  } else if (newStatus === "completed") {
    await createNotification({
      userId: booking.customerId.toString(),
      type: "service_completed",
      title: "Your cleaning is complete",
      message: `Booking ${booking.bookingNumber} is complete. Tell us how it went.`,
      href: `/bookings/${bookingId}/review`,
      bookingId,
      dedupeKey: `service-completed:${bookingId}`,
      email: true,
    }).catch((error) => console.error("[notification:service-completed]", error));
  }

  return booking.toObject();
}
