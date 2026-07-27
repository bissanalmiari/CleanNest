import "server-only";

import Booking from "@/models/Booking";
import CleanerAssignment from "@/models/CleanerAssignment";
import Review from "@/models/Review";
import { connectDB } from "@/lib/db";
import {
  createNotifications,
  deliverPendingNotificationEmails,
} from "@/services/notificationService";
import { bookingDateTimeToUtc } from "@/validators/bookingValidator";

const BUSINESS_TIME_ZONE = process.env.BUSINESS_TIME_ZONE?.trim() || "Asia/Beirut";

function dateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function nextDateKey(now: Date) {
  const today = new Date(`${dateKey(now)}T12:00:00.000Z`);
  today.setUTCDate(today.getUTCDate() + 1);
  return today.toISOString().slice(0, 10);
}

export async function queueTomorrowBookingReminders(now = new Date()) {
  await connectDB();
  const tomorrow = nextDateKey(now);
  const tomorrowStart = bookingDateTimeToUtc(tomorrow, "00:00");
  const followingDate = new Date(`${tomorrow}T12:00:00.000Z`);
  followingDate.setUTCDate(followingDate.getUTCDate() + 1);
  const followingStart = bookingDateTimeToUtc(followingDate.toISOString().slice(0, 10), "00:00");
  const bookings = await Booking.find({
    status: "confirmed",
    bookingDate: { $gte: tomorrowStart, $lt: followingStart },
  })
    .select("_id bookingNumber customerId serviceId startTime endTime")
    .populate({ path: "serviceId", select: "name" })
    .lean();

  let queued = 0;
  for (const booking of bookings) {
    const service = booking.serviceId as unknown as { name?: string };
    const assignments = await CleanerAssignment.find({
      bookingId: booking._id,
      status: { $in: ["assigned", "accepted"] },
    })
      .select("cleanerId")
      .lean();
    const bookingId = booking._id.toString();
    const message = `${service?.name ?? "Your cleaning"} is scheduled tomorrow from ${booking.startTime} to ${booking.endTime}.`;
    const inputs = [
      {
        userId: booking.customerId.toString(),
        type: "booking_reminder" as const,
        title: "Your cleaning is tomorrow",
        message,
        href: "/bookings",
        bookingId,
        dedupeKey: `reminder:customer:${bookingId}:${tomorrow}`,
        email: true,
      },
      ...assignments.map((assignment) => ({
        userId: assignment.cleanerId.toString(),
        type: "booking_reminder" as const,
        title: "Tomorrow’s cleaning reminder",
        message: `${message} Booking ${booking.bookingNumber}.`,
        href: `/cleaner/jobs/${bookingId}`,
        bookingId,
        dedupeKey: `reminder:cleaner:${bookingId}:${assignment.cleanerId.toString()}:${tomorrow}`,
        email: true,
      })),
    ];
    await createNotifications(inputs);
    queued += inputs.length;
  }
  return { date: tomorrow, bookings: bookings.length, queued };
}

export async function queueReviewReminders(now = new Date()) {
  await connectDB();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const completedBookings = await Booking.find({
    status: "completed",
    updatedAt: { $gte: sevenDaysAgo, $lte: oneDayAgo },
  })
    .select("_id bookingNumber customerId updatedAt")
    .lean();

  const reviewedBookingIds = new Set(
    (
      await Review.find({
        bookingId: { $in: completedBookings.map((booking) => booking._id) },
      })
        .select("bookingId")
        .lean()
    ).map((review) => review.bookingId.toString())
  );

  const reminders = completedBookings
    .filter((booking) => !reviewedBookingIds.has(booking._id.toString()))
    .map((booking) => {
      const bookingId = booking._id.toString();
      const ageDays = (now.getTime() - new Date(booking.updatedAt).getTime()) / 86_400_000;
      const stage = ageDays >= 3 ? "3d" : "1d";
      return {
        userId: booking.customerId.toString(),
        type: "service_completed" as const,
        title: stage === "3d" ? "A final review reminder" : "How was your cleaning?",
        message: `Share your experience with booking ${booking.bookingNumber}. It takes less than a minute.`,
        href: `/bookings/${bookingId}/review`,
        bookingId,
        dedupeKey: `review-reminder:${stage}:${bookingId}`,
        email: true,
      };
    });

  if (reminders.length > 0) {
    await createNotifications(reminders);
  }

  return { eligible: completedBookings.length, queued: reminders.length };
}

export async function processNotificationQueue(now = new Date()) {
  const [reminders, reviewReminders] = await Promise.all([
    queueTomorrowBookingReminders(now),
    queueReviewReminders(now),
  ]);
  const email = await deliverPendingNotificationEmails(50);
  return {
    timeZone: BUSINESS_TIME_ZONE,
    processedAt: now.toISOString(),
    reminders,
    reviewReminders,
    email,
  };
}
