import "server-only";

import { Types } from "mongoose";

import { AppError, NotFoundError } from "@/lib/apiError";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import BookingStatusHistory from "@/models/BookingStatusHistory";
import CleanerAssignment from "@/models/CleanerAssignment";
import {
  assertProofReadyAndCheckOut,
  checkInServiceProof,
  markCleanerOnMyWay,
} from "@/services/serviceProofService";
import { createNotification, notifyActiveAdmins } from "@/services/notificationService";
import type { CleanerJob, CleanerJobsResponse } from "@/types/cleanerPortal";

type JobScope = "today" | "upcoming";
type JobAction = "accept" | "on_my_way" | "start" | "demo_start" | "complete";

function demoCheckInEnabled() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_DEMO_CHECK_IN === "true" ||
    process.env.NEXT_PUBLIC_ENABLE_DEMO_CHECK_IN === "true" ||
    process.env.STRIPE_SECRET_KEY?.trim().startsWith("sk_test_") === true
  );
}

interface PopulatedBooking {
  _id: Types.ObjectId;
  bookingNumber: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  bookingDate: Date;
  startTime: string;
  endTime: string;
  estimatedDurationMinutes?: number;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  propertySize?: number;
  customerNotes?: string;
  adminNotes?: string;
  paymentMethod: string;
  paymentStatus: string;
  customerId?: { name?: string; phone?: string } | null;
  serviceId?: { name?: string } | null;
  addressId?: {
    label?: string;
    city?: string;
    area?: string;
    street?: string;
    building?: string;
    floor?: string;
    apartment?: string;
    landmark?: string;
    accessInstructions?: string;
    contactPhone?: string;
  } | null;
}

interface PopulatedAssignment {
  _id: Types.ObjectId;
  status: "assigned" | "accepted" | "declined" | "completed";
  bookingId: PopulatedBooking | null;
}

function dateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Beirut",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function toJob(assignment: PopulatedAssignment): CleanerJob {
  const booking = assignment.bookingId;
  if (!booking) throw new NotFoundError("Assigned booking not found");
  const address = booking.addressId;
  const addressLine = [
    address?.street,
    address?.building && `Building ${address.building}`,
    address?.floor && `Floor ${address.floor}`,
    address?.apartment && `Apartment ${address.apartment}`,
    address?.area,
    address?.city,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    id: booking._id.toString(),
    assignmentId: assignment._id.toString(),
    assignmentStatus: assignment.status,
    bookingNumber: booking.bookingNumber,
    status: booking.status,
    bookingDate: dateKey(booking.bookingDate),
    startTime: booking.startTime,
    endTime: booking.endTime,
    estimatedDurationMinutes: booking.estimatedDurationMinutes ?? 0,
    serviceName: booking.serviceId?.name ?? "Cleaning service",
    customerName: booking.customerId?.name ?? "Customer",
    customerPhone: address?.contactPhone ?? booking.customerId?.phone ?? null,
    addressLabel: address?.label ?? "Service address",
    addressLine: addressLine || "Address details unavailable",
    city: address?.city ?? "",
    area: address?.area ?? "",
    building: address?.building || null,
    floor: address?.floor || null,
    apartment: address?.apartment || null,
    landmark: address?.landmark || null,
    accessInstructions: address?.accessInstructions || null,
    propertyType: booking.propertyType,
    bedrooms: booking.bedrooms ?? null,
    bathrooms: booking.bathrooms ?? null,
    propertySize: booking.propertySize ?? null,
    customerNotes: booking.customerNotes || null,
    adminNotes: booking.adminNotes || null,
    paymentMethod: booking.paymentMethod,
    paymentStatus: booking.paymentStatus,
    testingCheckInEnabled: demoCheckInEnabled(),
  };
}

async function assignmentsForCleaner(cleanerId: string) {
  await connectDB();
  const assignments = await CleanerAssignment.find({
    cleanerId,
    status: { $ne: "declined" },
  })
    .populate({
      path: "bookingId",
      populate: [
        { path: "customerId", select: "name phone" },
        { path: "serviceId", select: "name" },
        {
          path: "addressId",
          select:
            "label city area street building floor apartment landmark accessInstructions contactPhone",
        },
      ],
    })
    .lean()
    .exec();

  return assignments as unknown as PopulatedAssignment[];
}

export async function listCleanerJobs(
  cleanerId: string,
  scope: JobScope
): Promise<CleanerJobsResponse> {
  const today = dateKey(new Date());
  const jobs = (await assignmentsForCleaner(cleanerId))
    .filter((assignment) => {
      const booking = assignment.bookingId;
      if (!booking || booking.status === "cancelled") return false;
      const key = dateKey(booking.bookingDate);
      return scope === "today" ? key === today : key > today && booking.status !== "completed";
    })
    .map(toJob)
    .sort((a, b) =>
      `${a.bookingDate}-${a.startTime}`.localeCompare(`${b.bookingDate}-${b.startTime}`)
    );

  return {
    jobs,
    summary: {
      total: jobs.length,
      assigned: jobs.filter((job) => job.assignmentStatus === "assigned").length,
      accepted: jobs.filter((job) => job.assignmentStatus === "accepted").length,
      inProgress: jobs.filter((job) => job.status === "in_progress").length,
      completed: jobs.filter((job) => job.status === "completed").length,
    },
  };
}

export async function getCleanerJob(cleanerId: string, bookingId: string) {
  if (!Types.ObjectId.isValid(bookingId)) {
    throw new AppError("Booking ID is invalid", 422);
  }
  const assignment = await CleanerAssignment.findOne({
    cleanerId,
    bookingId,
  })
    .populate({
      path: "bookingId",
      populate: [
        { path: "customerId", select: "name phone" },
        { path: "serviceId", select: "name" },
        {
          path: "addressId",
          select:
            "label city area street building floor apartment landmark accessInstructions contactPhone",
        },
      ],
    })
    .lean()
    .exec();

  if (!assignment || assignment.status === "declined") {
    throw new NotFoundError("Job not found");
  }
  return toJob(assignment as unknown as PopulatedAssignment);
}

export async function performCleanerJobAction(
  cleanerId: string,
  bookingId: string,
  action: JobAction,
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  }
) {
  await connectDB();
  const assignment = await CleanerAssignment.findOne({
    cleanerId,
    bookingId,
  });
  if (!assignment) throw new NotFoundError("Job assignment not found");

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new NotFoundError("Booking not found");

  if (action === "accept") {
    if (assignment.status !== "assigned") {
      throw new AppError("Only a new assignment can be accepted", 409);
    }
    assignment.status = "accepted";
    await assignment.save();
    await notifyActiveAdmins({
      type: "assignment_accepted",
      title: "Cleaner acknowledged an assignment",
      message: `The assigned cleaner has seen booking ${booking.bookingNumber}.`,
      href: `/admin/bookings/${bookingId}`,
      bookingId,
      dedupeKey: `assignment-accepted:${assignment._id.toString()}`,
      email: false,
    }).catch((error) => console.error("[notification:assignment-accepted]", error));
  } else if (action === "on_my_way") {
    if (assignment.status !== "accepted") {
      throw new AppError("Acknowledge this assignment before going on the way", 409);
    }
    if (booking.status !== "confirmed" && booking.status !== "in_progress") {
      throw new AppError("Only an approved booking can be started", 409);
    }
    if (dateKey(booking.bookingDate) !== dateKey(new Date())) {
      throw new AppError("On My Way is available on the scheduled day", 409);
    }
    await markCleanerOnMyWay(cleanerId, bookingId);
  } else if (action === "start" || action === "demo_start") {
    const isDemoStart = action === "demo_start";
    if (isDemoStart && !demoCheckInEnabled()) {
      throw new AppError("Demo check-in is disabled in this environment", 403);
    }
    if (assignment.status !== "accepted") {
      throw new AppError("Acknowledge this assignment before starting", 409);
    }
    if (booking.status !== "confirmed" && booking.status !== "in_progress") {
      throw new AppError("Only an approved booking can be started", 409);
    }
    if (!isDemoStart && dateKey(booking.bookingDate) !== dateKey(new Date())) {
      throw new AppError("This job can only be started on its scheduled day", 409);
    }
    await checkInServiceProof(cleanerId, bookingId, location);
    if (booking.status === "confirmed") {
      const previousStatus = booking.status;
      booking.status = "in_progress";
      await booking.save();
      await BookingStatusHistory.create({
        bookingId,
        previousStatus,
        newStatus: "in_progress",
        changedByUserId: cleanerId,
        reason: isDemoStart
          ? "DEMO: Cleaner used the testing check-in outside the scheduled day."
          : "Cleaner checked in and started the service.",
      });
      if (!isDemoStart) {
        await createNotification({
          userId: booking.customerId.toString(),
          type: "service_started",
          title: "Your cleaning has started",
          message: `The cleaner checked in for booking ${booking.bookingNumber}.`,
          href: "/bookings",
          bookingId,
          dedupeKey: `service-started:${bookingId}`,
          email: true,
        }).catch((error) => console.error("[notification:service-started]", error));
        await notifyActiveAdmins({
          type: "service_started",
          title: "Cleaning service started",
          message: `The cleaner checked in and started booking ${booking.bookingNumber}.`,
          href: `/admin/bookings/${bookingId}`,
          bookingId,
          dedupeKey: `admin-service-started:${bookingId}`,
          email: false,
        }).catch((error) => console.error("[notification:admin-service-started]", error));
      }
    }
  } else {
    if (assignment.status !== "accepted" || booking.status !== "in_progress") {
      throw new AppError("Only an active job can be completed", 409);
    }
    await assertProofReadyAndCheckOut(cleanerId, bookingId);
    assignment.status = "completed";
    await assignment.save();
    const remaining = await CleanerAssignment.countDocuments({
      bookingId,
      status: { $in: ["assigned", "accepted"] },
    });
    if (remaining === 0) {
      const previousStatus = booking.status;
      booking.status = "completed";
      await booking.save();
      await BookingStatusHistory.create({
        bookingId,
        previousStatus,
        newStatus: "completed",
        changedByUserId: cleanerId,
        reason: "All assigned cleaners completed the service.",
      });
      await createNotification({
        userId: booking.customerId.toString(),
        type: "service_completed",
        title: "Your cleaning is complete",
        message: `Booking ${booking.bookingNumber} is complete. View the service report and share your review.`,
        href: `/bookings/${bookingId}/review`,
        bookingId,
        dedupeKey: `service-completed:${bookingId}`,
        email: true,
      }).catch((error) => console.error("[notification:service-completed]", error));
      await notifyActiveAdmins({
        type: "service_completed",
        title: "Cleaning service completed",
        message: `All assigned cleaners completed booking ${booking.bookingNumber}.`,
        href: `/admin/bookings/${bookingId}`,
        bookingId,
        dedupeKey: `admin-service-completed:${bookingId}`,
        email: false,
      }).catch((error) => console.error("[notification:admin-service-completed]", error));
    }
  }

  return getCleanerJob(cleanerId, bookingId).catch(() => ({
    id: bookingId,
    assignmentStatus: assignment.status,
    status: booking.status,
  }));
}
