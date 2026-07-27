import "server-only";

import mongoose, {
  Types,
} from "mongoose";

import { AppError } from "@/lib/apiError";
import { connectDB } from "@/lib/db";

import BookingModel from "@/models/Booking";
import BookingRescheduleHistoryModel from "@/models/BookingRescheduleHistory";
import ServiceAreaModel from "@/models/ServiceArea";
import CleanerAssignment from "@/models/CleanerAssignment";

import {
  bookingDateTimeToUtc,
  checkBookingChangeWindow,
  type RescheduleBookingInput,
} from "@/validators/bookingValidator";

import {
  BookingAvailabilityError,
  checkBookingAvailability,
} from "@/services/bookingAvailabilityService";
import {
  createNotification,
  createNotifications,
  notifyActiveAdmins,
} from "@/services/notificationService";

interface RescheduleCustomerBookingOptions {
  customerId: string;
  bookingId: string;
  input: RescheduleBookingInput;
  now?: Date;
}

interface RescheduledBookingResult {
  booking: {
    id: string;
    bookingNumber: string;
    status: string;

    previousSchedule: {
      bookingDate: string;
      startTime: string;
      endTime: string;
      estimatedDurationMinutes: number;
    };

    newSchedule: {
      bookingDate: string;
      startTime: string;
      endTime: string;
      estimatedDurationMinutes: number;
    };

    rescheduleCount: number;
    lastRescheduledAt: string;

    reason: string | null;

    cleanerAssignment: {
      wasCleared: boolean;
      previousCleanerName: string | null;
      assignedCleanerName: null;
    };

    historyId: string;
    updatedAt: string;
  };
}

function validateObjectId(
  value: string,
  fieldName: string,
) {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(
      `${fieldName} is invalid.`,
      422,
    );
  }

  return new Types.ObjectId(value);
}

function timeToMinutes(
  value: string,
) {
  const [hours = 0, minutes = 0] =
    value.split(":").map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(
  totalMinutes: number,
) {
  const hours = Math.floor(
    totalMinutes / 60,
  );

  const minutes =
    totalMinutes % 60;

  return `${String(hours).padStart(
    2,
    "0",
  )}:${String(minutes).padStart(
    2,
    "0",
  )}`;
}

/*
 * Rescheduling keeps the existing cleaning plan,
 * property details and add-ons.
 *
 * Therefore, the booking duration remains unchanged.
 * The new end time is calculated from the new start time.
 */
function calculateEndTime(
  startTime: string,
  durationMinutes: number,
) {
  const startMinutes =
    timeToMinutes(startTime);

  const endMinutes =
    startMinutes +
    durationMinutes;

  if (endMinutes >= 24 * 60) {
    throw new AppError(
      "The selected start time would make the cleaning continue past midnight. Please select an earlier time.",
      422,
    );
  }

  return minutesToTime(endMinutes);
}

function calculateDurationFromTimes(
  startTime: string,
  endTime: string,
) {
  const startMinutes =
    timeToMinutes(startTime);

  const endMinutes =
    timeToMinutes(endTime);

  const durationMinutes =
    endMinutes - startMinutes;

  if (durationMinutes <= 0) {
    throw new AppError(
      "The existing booking has an invalid time range.",
      500,
    );
  }

  return durationMinutes;
}

function formatDateInBeirut(
  date: Date,
) {
  const formatter =
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Beirut",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  const parts =
    formatter.formatToParts(date);

  const year = parts.find(
    (part) => part.type === "year",
  )?.value;

  const month = parts.find(
    (part) => part.type === "month",
  )?.value;

  const day = parts.find(
    (part) => part.type === "day",
  )?.value;

  if (!year || !month || !day) {
    throw new AppError(
      "Unable to determine the booking date.",
      500,
    );
  }

  return `${year}-${month}-${day}`;
}

function mapAvailabilityError(
  error: unknown,
): never {
  if (
    error instanceof
    BookingAvailabilityError
  ) {
    throw new AppError(
      error.message,
      error.statusCode,
    );
  }

  throw error;
}

function normalizeReason(
  reason?: string,
) {
  const normalized =
    reason?.trim();

  return normalized || undefined;
}

/*
 * Reschedules a booking belonging to the logged-in
 * customer.
 *
 * Rules:
 * - The booking must belong to the customer.
 * - Only pending or confirmed bookings may change.
 * - The existing booking must be more than 24 hours away.
 * - The new date and time must be in the future.
 * - The new schedule must be different.
 * - Availability is checked while excluding this booking.
 * - The existing duration is preserved.
 * - The assigned cleaner name is cleared because the
 *   admin must confirm availability for the new schedule.
 * - A complete reschedule-history record is created.
 */
export async function rescheduleCustomerBooking({
  customerId,
  bookingId,
  input,
  now = new Date(),
}: RescheduleCustomerBookingOptions): Promise<RescheduledBookingResult> {
  await connectDB();

  const customerObjectId =
    validateObjectId(
      customerId,
      "Customer ID",
    );

  const bookingObjectId =
    validateObjectId(
      bookingId,
      "Booking ID",
    );

  const booking =
    await BookingModel.findOne({
      _id: bookingObjectId,
      customerId: customerObjectId,
    }).exec();

  if (!booking) {
    throw new AppError(
      "The booking could not be found.",
      404,
    );
  }

  /*
   * This checks status and the 24-hour rule against
   * the booking's current schedule.
   */
  const changeWindow =
    checkBookingChangeWindow({
      bookingDate:
        booking.bookingDate,

      startTime:
        booking.startTime,

      status:
        booking.status,

      now,
    });

  if (!changeWindow.allowed) {
    throw new AppError(
      changeWindow.reason ??
        "This booking can no longer be rescheduled.",
      409,
    );
  }

  const serviceArea =
    await ServiceAreaModel.findById(
      booking.serviceAreaId,
    ).exec();

  if (
    !serviceArea ||
    !serviceArea.isActive
  ) {
    throw new AppError(
      "The booking service area is currently unavailable.",
      409,
    );
  }

  const currentBookingDate =
    formatDateInBeirut(
      booking.bookingDate,
    );

  const durationMinutes =
    booking.estimatedDurationMinutes ??
    calculateDurationFromTimes(
      booking.startTime,
      booking.endTime,
    );

  const calculatedEndTime =
    calculateEndTime(
      input.startTime,
      durationMinutes,
    );

  const requestedStartDatetime =
    bookingDateTimeToUtc(
      input.bookingDate,
      input.startTime,
    );

  if (
    requestedStartDatetime.getTime() <=
    now.getTime()
  ) {
    throw new AppError(
      "The new booking date and time must be in the future.",
      422,
    );
  }

  const sameDate =
    currentBookingDate ===
    input.bookingDate;

  const sameStartTime =
    booking.startTime ===
    input.startTime;

  const sameEndTime =
    booking.endTime ===
    calculatedEndTime;

  if (
    sameDate &&
    sameStartTime &&
    sameEndTime
  ) {
    throw new AppError(
      "Please select a different date or start time.",
      422,
    );
  }

  /*
   * The frontend may send endTime, but the trusted end
   * time is calculated from the existing duration.
   */
  let preliminaryAvailability;

  try {
    preliminaryAvailability =
      await checkBookingAvailability(
        {
          serviceId:
            booking.serviceId.toString(),

          serviceAreaId:
            booking.serviceAreaId.toString(),

          bookingDate:
            input.bookingDate,

          startTime:
            input.startTime,

          endTime:
            calculatedEndTime,

          excludeBookingId:
            bookingObjectId.toString(),
        },
        {
          maximumConcurrentBookings:
            serviceArea
              .maximumConcurrentBookings,
        },
      );
  } catch (error) {
    mapAvailabilityError(error);
  }

  if (
    !preliminaryAvailability.available
  ) {
    throw new AppError(
      preliminaryAvailability.message,
      409,
    );
  }

  const newBookingDate =
    bookingDateTimeToUtc(
      input.bookingDate,
      "00:00",
    );

  const rescheduleReason =
    normalizeReason(input.reason);

  const session =
    await mongoose.startSession();

  try {
    const transactionResult =
      await session.withTransaction(
        async () => {
          /*
           * Reload inside the transaction to prevent a
           * stale status or schedule from being changed.
           */
          const transactionalBooking =
            await BookingModel.findOne({
              _id: bookingObjectId,
              customerId:
                customerObjectId,
            })
              .session(session)
              .exec();

          if (!transactionalBooking) {
            throw new AppError(
              "The booking could not be found.",
              404,
            );
          }

          const latestChangeWindow =
            checkBookingChangeWindow({
              bookingDate:
                transactionalBooking
                  .bookingDate,

              startTime:
                transactionalBooking
                  .startTime,

              status:
                transactionalBooking
                  .status,

              now,
            });

          if (
            !latestChangeWindow.allowed
          ) {
            throw new AppError(
              latestChangeWindow.reason ??
                "This booking can no longer be rescheduled.",
              409,
            );
          }

          const previousBookingDate =
            transactionalBooking
              .bookingDate;

          const previousBookingDateText =
            formatDateInBeirut(
              previousBookingDate,
            );

          const previousStartTime =
            transactionalBooking
              .startTime;

          const previousEndTime =
            transactionalBooking
              .endTime;

          const previousDurationMinutes =
            transactionalBooking
              .estimatedDurationMinutes ??
            calculateDurationFromTimes(
              previousStartTime,
              previousEndTime,
            );

          /*
           * Ensure the booking was not changed after the
           * preliminary availability check.
           */
          const scheduleChangedSinceRead =
            previousBookingDateText !==
              currentBookingDate ||
            previousStartTime !==
              booking.startTime ||
            previousEndTime !==
              booking.endTime;

          if (scheduleChangedSinceRead) {
            throw new AppError(
              "This booking schedule was changed by another request. Please refresh and try again.",
              409,
            );
          }

          /*
           * Recheck availability immediately before saving.
           */
          let latestAvailability;

          try {
            latestAvailability =
              await checkBookingAvailability(
                {
                  serviceId:
                    transactionalBooking
                      .serviceId
                      .toString(),

                  serviceAreaId:
                    transactionalBooking
                      .serviceAreaId
                      .toString(),

                  bookingDate:
                    input.bookingDate,

                  startTime:
                    input.startTime,

                  endTime:
                    calculatedEndTime,

                  excludeBookingId:
                    bookingObjectId.toString(),
                },
                {
                  maximumConcurrentBookings:
                    serviceArea
                      .maximumConcurrentBookings,
                },
              );
          } catch (error) {
            mapAvailabilityError(error);
          }

          if (
            !latestAvailability.available
          ) {
            throw new AppError(
              latestAvailability.message,
              409,
            );
          }

          const previousCleanerName =
            transactionalBooking
              .assignedCleanerName ??
            null;

          /*
           * A cleaner name assigned to the old schedule
           * cannot automatically be trusted for the new one.
           * The admin must assign or confirm the cleaner again.
           */
          transactionalBooking.assignedCleanerName =
            undefined;

          transactionalBooking.bookingDate =
            newBookingDate;

          transactionalBooking.startTime =
            input.startTime;

          transactionalBooking.endTime =
            calculatedEndTime;

          transactionalBooking.estimatedDurationMinutes =
            previousDurationMinutes;

          transactionalBooking.rescheduleCount =
            (
              transactionalBooking
                .rescheduleCount ?? 0
            ) + 1;

          transactionalBooking.lastRescheduledAt =
            now;

          await transactionalBooking.save({
            session,
          });

          const historyDocuments =
            await BookingRescheduleHistoryModel.create(
              [
                {
                  bookingId:
                    bookingObjectId,

                  previousBookingDate,

                  previousStartTime,

                  previousEndTime,

                  newBookingDate,

                  newStartTime:
                    input.startTime,

                  newEndTime:
                    calculatedEndTime,

                  previousDurationMinutes,

                  newDurationMinutes:
                    previousDurationMinutes,

                  reason:
                    rescheduleReason,

                  changedByUserId:
                    customerObjectId,

                  source:
                    "customer",
                },
              ],
              {
                session,
              },
            );

          const history =
            historyDocuments.at(0);

          if (!history) {
            throw new AppError(
              "The reschedule history could not be created.",
              500,
            );
          }

          return {
            booking:
              transactionalBooking,

            history,

            previousBookingDateText,

            previousStartTime,

            previousEndTime,

            previousDurationMinutes,

            previousCleanerName,
          };
        },
      );

    if (!transactionResult) {
      throw new AppError(
        "The reschedule transaction did not return a booking.",
        500,
      );
    }

    const {
      booking: updatedBooking,
      history,
      previousBookingDateText,
      previousStartTime,
      previousEndTime,
      previousDurationMinutes,
      previousCleanerName,
    } = transactionResult;

    const assignedCleaners = await CleanerAssignment.find({
      bookingId: updatedBooking._id,
      status: { $in: ["assigned", "accepted"] },
    })
      .select("cleanerId")
      .lean();
    const newScheduleMessage = `Booking ${updatedBooking.bookingNumber} moved to ${input.bookingDate} from ${updatedBooking.startTime} to ${updatedBooking.endTime}.`;
    await Promise.all([
      createNotification({
        userId: customerId,
        type: "booking_rescheduled",
        title: "Booking rescheduled",
        message: newScheduleMessage,
        href: "/bookings",
        bookingId,
        dedupeKey: `booking-rescheduled:${bookingId}:${updatedBooking.rescheduleCount}`,
        email: true,
      }),
      createNotifications(
        assignedCleaners.map((assignment) => ({
          userId: assignment.cleanerId.toString(),
          type: "booking_rescheduled" as const,
          title: "Assigned job rescheduled",
          message: newScheduleMessage,
          href: `/cleaner/jobs/${bookingId}`,
          bookingId,
          dedupeKey: `booking-rescheduled:${bookingId}:${updatedBooking.rescheduleCount}:${assignment.cleanerId.toString()}`,
          email: true,
        })),
      ),
      notifyActiveAdmins({
        type: "booking_rescheduled",
        title: "Customer rescheduled a booking",
        message: newScheduleMessage,
        href: `/admin/bookings/${bookingId}`,
        bookingId,
        dedupeKey: `customer-rescheduled:${bookingId}:${updatedBooking.rescheduleCount}`,
        email: false,
      }),
    ]).catch((error) => console.error("[notification:reschedule]", error));

    return {
      booking: {
        id:
          updatedBooking._id.toString(),

        bookingNumber:
          updatedBooking.bookingNumber,

        status:
          updatedBooking.status,

        previousSchedule: {
          bookingDate:
            previousBookingDateText,

          startTime:
            previousStartTime,

          endTime:
            previousEndTime,

          estimatedDurationMinutes:
            previousDurationMinutes,
        },

        newSchedule: {
          bookingDate:
            input.bookingDate,

          startTime:
            updatedBooking.startTime,

          endTime:
            updatedBooking.endTime,

          estimatedDurationMinutes:
            updatedBooking
              .estimatedDurationMinutes ??
            previousDurationMinutes,
        },

        rescheduleCount:
          updatedBooking.rescheduleCount,

        lastRescheduledAt:
          (
            updatedBooking
              .lastRescheduledAt ??
            now
          ).toISOString(),

        reason:
          rescheduleReason ?? null,

        cleanerAssignment: {
          wasCleared:
            previousCleanerName !==
            null,

          previousCleanerName,

          assignedCleanerName:
            null,
        },

        historyId:
          history._id.toString(),

        updatedAt:
          updatedBooking.updatedAt.toISOString(),
      },
    };
  } finally {
    await session.endSession();
  }
}
