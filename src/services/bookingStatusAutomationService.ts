import "server-only";

import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import CleanerAssignment from "@/models/CleanerAssignment";
import BookingStatusHistory from "@/models/BookingStatusHistory";
import { createNotification } from "@/services/notificationService";

const BUSINESS_TIME_ZONE =
  process.env.BUSINESS_TIME_ZONE?.trim() || "Asia/Beirut";

const RECONCILIATION_THROTTLE_MS = 30_000;

type ReconciliationResult = {
  checked: number;
  completed: number;
  completedBookingIds: string[];
  timeZone: string;
  checkedAt: string;
  throttled?: boolean;
};

type ReconciliationCache = {
  lastRunAt: number;
  lastResult: ReconciliationResult | null;
  pending: Promise<ReconciliationResult> | null;
};

const globalForReconciliation = globalThis as typeof globalThis & {
  cleanNestReconciliationCache?: ReconciliationCache;
};

const reconciliationCache =
  globalForReconciliation.cleanNestReconciliationCache ??
  (globalForReconciliation.cleanNestReconciliationCache = {
    lastRunAt: 0,
    lastResult: null,
    pending: null,
  });

function localDateTimeKey(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${value("year")}-${value("month")}-${value("day")}T${value(
    "hour"
  )}:${value("minute")}`;
}

function scheduledEndKey(bookingDate: Date, endTime: string) {
  const day = localDateTimeKey(bookingDate, BUSINESS_TIME_ZONE).slice(0, 10);
  return `${day}T${endTime.slice(0, 5)}`;
}

async function performElapsedBookingReconciliation(now = new Date()) {
  await connectDB();

  const currentKey = localDateTimeKey(now, BUSINESS_TIME_ZONE);
  const currentDay = currentKey.slice(0, 10);
  const candidates = await Booking.find({
    status: { $in: ["confirmed", "in_progress"] },
    bookingDate: { $lte: new Date(`${currentDay}T23:59:59.999Z`) },
  })
    .select("_id bookingNumber customerId bookingDate endTime status")
    .lean()
    .exec();

  const elapsed = candidates.filter(
    (booking) =>
      Boolean(booking.endTime) &&
      scheduledEndKey(booking.bookingDate, booking.endTime) <= currentKey
  );

  const completedIds: string[] = [];

  await Promise.all(
    elapsed.map(async (booking) => {
      const updated = await Booking.findOneAndUpdate(
        {
          _id: booking._id,
          status: { $in: ["confirmed", "in_progress"] },
        },
        { $set: { status: "completed" } },
        { new: false }
      )
        .select("status")
        .lean()
        .exec();

      if (!updated) return;

      completedIds.push(String(booking._id));
      await Promise.all([
        BookingStatusHistory.create({
          bookingId: booking._id,
          previousStatus: updated.status,
          newStatus: "completed",
          reason: "Automatically completed after the scheduled end time.",
          metadata: {
            actor: "system",
            timeZone: BUSINESS_TIME_ZONE,
            scheduledEnd: scheduledEndKey(booking.bookingDate, booking.endTime),
          },
        }),
        CleanerAssignment.updateMany(
          {
            bookingId: booking._id,
            status: { $in: ["assigned", "accepted"] },
          },
          { $set: { status: "completed" } }
        ),
        createNotification({
          userId: booking.customerId.toString(),
          type: "service_completed",
          title: "Your cleaning is complete",
          message: `Booking ${booking.bookingNumber} reached its scheduled completion time. You can now review the service.`,
          href: `/bookings/${booking._id.toString()}/review`,
          bookingId: booking._id.toString(),
          dedupeKey: `service-completed:${booking._id.toString()}`,
          email: true,
        }).catch((error) =>
          console.error("[notification:auto-completion]", error),
        ),
      ]);
    })
  );

  return {
    checked: candidates.length,
    completed: completedIds.length,
    completedBookingIds: completedIds,
    timeZone: BUSINESS_TIME_ZONE,
    checkedAt: now.toISOString(),
  };
}

/**
 * Several pages request related booking data in parallel. Share one
 * reconciliation pass and reuse its result briefly so ordinary reads do not
 * repeatedly scan and update the same booking collection.
 */
export async function reconcileElapsedBookings(
  now = new Date(),
  options: {
    force?: boolean;
  } = {},
): Promise<ReconciliationResult> {
  if (reconciliationCache.pending) {
    return reconciliationCache.pending;
  }

  const isFresh =
    reconciliationCache.lastResult &&
    Date.now() - reconciliationCache.lastRunAt < RECONCILIATION_THROTTLE_MS;

  if (!options.force && isFresh && reconciliationCache.lastResult) {
    return {
      ...reconciliationCache.lastResult,
      throttled: true,
    };
  }

  const pending = performElapsedBookingReconciliation(now)
    .then((result) => {
      reconciliationCache.lastRunAt = Date.now();
      reconciliationCache.lastResult = result;
      return result;
    })
    .finally(() => {
      reconciliationCache.pending = null;
    });

  reconciliationCache.pending = pending;
  return pending;
}
