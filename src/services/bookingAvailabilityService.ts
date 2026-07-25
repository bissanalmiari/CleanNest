import "server-only";

import { Types } from "mongoose";

import BookingModel from "@/models/Booking";
import BlockedTimeModel from "@/models/BlockedTime";
import { getRecurringScheduleBlock } from "@/lib/bookingScheduleRules";

import {
  bookingDateTimeToUtc,
  CLEAN_NEST_TIME_ZONE,
  type AvailabilityQueryInput,
} from "@/validators/bookingValidator";

const CAPACITY_CONSUMING_STATUSES = [
  "pending",
  "confirmed",
  "in_progress",
] as const;

const DEFAULT_MAXIMUM_CONCURRENT_BOOKINGS = 3;

export type BookingAvailabilityReason =
  | "AVAILABLE"
  | "PAST_TIME"
  | "BLOCKED_TIME"
  | "CAPACITY_REACHED";

export type BookingAvailabilityErrorCode =
  | "INVALID_SERVICE_ID"
  | "INVALID_SERVICE_AREA_ID"
  | "INVALID_BOOKING_ID"
  | "INVALID_TIME_RANGE";

export class BookingAvailabilityError extends Error {
  readonly code: BookingAvailabilityErrorCode;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: BookingAvailabilityErrorCode,
    message: string,
    statusCode = 400,
    details?: Record<string, unknown>,
  ) {
    super(message);

    this.name = "BookingAvailabilityError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export interface BookingConflict {
  bookingId: string;
  bookingNumber: string;
  status: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
}

export interface BlockedTimeConflict {
  blockedTimeId: string;
  scope: "company" | "service_area";
  blockType: string;
  reason: string;
  startDatetime: string;
  endDatetime: string;
}

export interface BookingAvailabilityResult {
  available: boolean;
  reason: BookingAvailabilityReason;
  message: string;

  requestedSlot: {
    serviceId: string;
    serviceAreaId: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    startDatetime: string;
    endDatetime: string;
    durationMinutes: number;
  };

  capacity: {
    maximumConcurrentBookings: number;
    overlappingBookings: number;
    remainingCapacity: number;
  };

  conflicts: {
    bookings: BookingConflict[];
    blockedTimes: BlockedTimeConflict[];
  };
}

interface CheckAvailabilityOptions {
  now?: Date;

  /*
   * Because CleanNest does not maintain cleaner accounts,
   * availability is based on company capacity within a
   * service area.
   */
  maximumConcurrentBookings?: number;
}

function getMaximumConcurrentBookings() {
  const configuredCapacity = Number.parseInt(
    process.env
      .CLEANNEST_MAX_SIMULTANEOUS_BOOKINGS ??
      "",
    10,
  );

  if (
    Number.isInteger(configuredCapacity) &&
    configuredCapacity > 0
  ) {
    return configuredCapacity;
  }

  return DEFAULT_MAXIMUM_CONCURRENT_BOOKINGS;
}

function normalizeCapacity(
  value: number | undefined,
) {
  if (
    value !== undefined &&
    Number.isInteger(value) &&
    value > 0
  ) {
    return value;
  }

  return getMaximumConcurrentBookings();
}

function toObjectId(
  value: string,
  errorCode: BookingAvailabilityErrorCode,
  fieldName: string,
) {
  if (!Types.ObjectId.isValid(value)) {
    throw new BookingAvailabilityError(
      errorCode,
      `${fieldName} is invalid.`,
      400,
      {
        field: fieldName,
        value,
      },
    );
  }

  return new Types.ObjectId(value);
}

function getDateInTimeZone(
  date: Date,
  timeZone = CLEAN_NEST_TIME_ZONE,
) {
  const formatter =
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
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
    throw new BookingAvailabilityError(
      "INVALID_TIME_RANGE",
      "Unable to determine the booking date.",
    );
  }

  return `${year}-${month}-${day}`;
}

function getNextCalendarDate(
  dateText: string,
) {
  const parts = dateText.split("-");

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
    ),
  );

  date.setUTCDate(
    date.getUTCDate() + 1,
  );

  return date
    .toISOString()
    .slice(0, 10);
}

function timeRangesOverlap(
  firstStart: Date,
  firstEnd: Date,
  secondStart: Date,
  secondEnd: Date,
) {
  return (
    firstStart.getTime() <
      secondEnd.getTime() &&
    firstEnd.getTime() >
      secondStart.getTime()
  );
}

function buildAvailabilityMessage(
  reason: BookingAvailabilityReason,
  remainingCapacity: number,
) {
  switch (reason) {
    case "PAST_TIME":
      return "The selected booking time has already passed.";

    case "BLOCKED_TIME":
      return "CleanNest is unavailable during the selected period.";

    case "CAPACITY_REACHED":
      return "The selected time is fully booked. Please choose another time.";

    case "AVAILABLE":
    default:
      return remainingCapacity === 1
        ? "This time is available. One booking space remains."
        : `This time is available. ${remainingCapacity} booking spaces remain.`;
  }
}

/*
 * Checks whether a requested booking overlaps an
 * active company or service-area blocked period.
 */
async function findBlockedTimeConflicts({
  serviceAreaId,
  requestedStart,
  requestedEnd,
}: {
  serviceAreaId: Types.ObjectId;
  requestedStart: Date;
  requestedEnd: Date;
}) {
  const blockedTimes =
    await BlockedTimeModel.find({
      isActive: true,

      startDatetime: {
        $lt: requestedEnd,
      },

      endDatetime: {
        $gt: requestedStart,
      },

      $or: [
        {
          serviceAreaId: {
            $exists: false,
          },
        },
        {
          serviceAreaId: null,
        },
        {
          serviceAreaId,
        },
      ],
    })
      .select(
        [
          "_id",
          "serviceAreaId",
          "startDatetime",
          "endDatetime",
          "blockType",
          "reason",
        ].join(" "),
      )
      .sort({
        startDatetime: 1,
      })
      .lean()
      .exec();

  return blockedTimes.map(
    (blockedTime): BlockedTimeConflict => ({
      blockedTimeId:
        blockedTime._id.toString(),

      scope: blockedTime.serviceAreaId
        ? "service_area"
        : "company",

      blockType:
        blockedTime.blockType,

      reason:
        blockedTime.reason ||
        "This time has been blocked by CleanNest.",

      startDatetime:
        new Date(
          blockedTime.startDatetime,
        ).toISOString(),

      endDatetime:
        new Date(
          blockedTime.endDatetime,
        ).toISOString(),
    }),
  );
}

/*
 * Finds active bookings on the same local booking
 * date and then performs an exact time-overlap check.
 */
async function findBookingConflicts({
  serviceAreaId,
  bookingDate,
  requestedStart,
  requestedEnd,
  excludeBookingId,
}: {
  serviceAreaId: Types.ObjectId;
  bookingDate: string;
  requestedStart: Date;
  requestedEnd: Date;
  excludeBookingId?: Types.ObjectId;
}) {
  const nextCalendarDate =
    getNextCalendarDate(bookingDate);

  const localDayStart =
    bookingDateTimeToUtc(
      bookingDate,
      "00:00",
    );

  const nextLocalDayStart =
    bookingDateTimeToUtc(
      nextCalendarDate,
      "00:00",
    );

  const bookingQuery: Record<
    string,
    unknown
  > = {
    serviceAreaId,

    status: {
      $in: CAPACITY_CONSUMING_STATUSES,
    },

    bookingDate: {
      $gte: localDayStart,
      $lt: nextLocalDayStart,
    },
  };

  if (excludeBookingId) {
    bookingQuery._id = {
      $ne: excludeBookingId,
    };
  }

  const bookings =
    await BookingModel.find(
      bookingQuery,
    )
      .select(
        [
          "_id",
          "bookingNumber",
          "bookingDate",
          "startTime",
          "endTime",
          "status",
        ].join(" "),
      )
      .sort({
        startTime: 1,
      })
      .lean()
      .exec();

  const conflicts: BookingConflict[] =
    [];

  for (const booking of bookings) {
    const existingBookingDate =
      getDateInTimeZone(
        new Date(
          booking.bookingDate,
        ),
      );

    const existingStart =
      bookingDateTimeToUtc(
        existingBookingDate,
        booking.startTime,
      );

    const existingEnd =
      bookingDateTimeToUtc(
        existingBookingDate,
        booking.endTime,
      );

    const overlaps =
      timeRangesOverlap(
        requestedStart,
        requestedEnd,
        existingStart,
        existingEnd,
      );

    if (!overlaps) {
      continue;
    }

    conflicts.push({
      bookingId:
        booking._id.toString(),

      bookingNumber:
        booking.bookingNumber,

      status: booking.status,

      bookingDate:
        existingBookingDate,

      startTime:
        booking.startTime,

      endTime:
        booking.endTime,
    });
  }

  return conflicts;
}

/*
 * Main availability-checking function.
 *
 * The API route must:
 * 1. Validate input with availabilityQuerySchema.
 * 2. Connect to MongoDB.
 * 3. Call this function.
 *
 * No cleaner account is required. Capacity is measured
 * by the number of overlapping active bookings in the
 * requested service area.
 */
export async function checkBookingAvailability(
  input: AvailabilityQueryInput,
  options: CheckAvailabilityOptions = {},
): Promise<BookingAvailabilityResult> {
  const now =
    options.now ?? new Date();

  const serviceObjectId =
    toObjectId(
      input.serviceId,
      "INVALID_SERVICE_ID",
      "Service ID",
    );

  const serviceAreaObjectId =
    toObjectId(
      input.serviceAreaId,
      "INVALID_SERVICE_AREA_ID",
      "Service-area ID",
    );

  const excludedBookingObjectId =
    input.excludeBookingId
      ? toObjectId(
          input.excludeBookingId,
          "INVALID_BOOKING_ID",
          "Excluded booking ID",
        )
      : undefined;

  const requestedStart =
    bookingDateTimeToUtc(
      input.bookingDate,
      input.startTime,
    );

  const requestedEnd =
    bookingDateTimeToUtc(
      input.bookingDate,
      input.endTime,
    );

  if (
    requestedEnd.getTime() <=
    requestedStart.getTime()
  ) {
    throw new BookingAvailabilityError(
      "INVALID_TIME_RANGE",
      "End time must be later than start time.",
    );
  }

  const durationMinutes =
    Math.round(
      (requestedEnd.getTime() -
        requestedStart.getTime()) /
        (1000 * 60),
    );

  const maximumConcurrentBookings =
    normalizeCapacity(
      options.maximumConcurrentBookings,
    );

  const emptyCapacity = {
    maximumConcurrentBookings,
    overlappingBookings: 0,
    remainingCapacity:
      maximumConcurrentBookings,
  };

  const requestedSlot = {
    serviceId:
      serviceObjectId.toString(),

    serviceAreaId:
      serviceAreaObjectId.toString(),

    bookingDate:
      input.bookingDate,

    startTime:
      input.startTime,

    endTime:
      input.endTime,

    startDatetime:
      requestedStart.toISOString(),

    endDatetime:
      requestedEnd.toISOString(),

    durationMinutes,
  };

  /*
   * This should normally be caught by the Zod
   * validator, but it is repeated here to keep
   * the service safe when called directly.
   */
  if (
    requestedStart.getTime() <=
    now.getTime()
  ) {
    return {
      available: false,
      reason: "PAST_TIME",
      message:
        buildAvailabilityMessage(
          "PAST_TIME",
          maximumConcurrentBookings,
        ),

      requestedSlot,
      capacity: emptyCapacity,

      conflicts: {
        bookings: [],
        blockedTimes: [],
      },
    };
  }

  const recurringScheduleBlock =
    getRecurringScheduleBlock({
      bookingDate: input.bookingDate,
      startTime: input.startTime,
      endTime: input.endTime,
    });

  if (recurringScheduleBlock) {
    return {
      available: false,
      reason: "BLOCKED_TIME",
      message: recurringScheduleBlock.reason,
      requestedSlot,
      capacity: emptyCapacity,
      conflicts: {
        bookings: [],
        blockedTimes: [
          {
            blockedTimeId: `recurring:${recurringScheduleBlock.code}`,
            scope: "company",
            blockType: "holiday",
            reason: recurringScheduleBlock.reason,
            startDatetime: requestedStart.toISOString(),
            endDatetime: requestedEnd.toISOString(),
          },
        ],
      },
    };
  }

  const [
    blockedTimeConflicts,
    bookingConflicts,
  ] = await Promise.all([
    findBlockedTimeConflicts({
      serviceAreaId:
        serviceAreaObjectId,

      requestedStart,
      requestedEnd,
    }),

    findBookingConflicts({
      serviceAreaId:
        serviceAreaObjectId,

      bookingDate:
        input.bookingDate,

      requestedStart,
      requestedEnd,

      excludeBookingId:
        excludedBookingObjectId,
    }),
  ]);

  const overlappingBookings =
    bookingConflicts.length;

  const remainingCapacity =
    Math.max(
      0,
      maximumConcurrentBookings -
        overlappingBookings,
    );

  const capacity = {
    maximumConcurrentBookings,
    overlappingBookings,
    remainingCapacity,
  };

  let reason:
    BookingAvailabilityReason =
      "AVAILABLE";

  if (
    blockedTimeConflicts.length > 0
  ) {
    reason = "BLOCKED_TIME";
  } else if (
    overlappingBookings >=
    maximumConcurrentBookings
  ) {
    reason = "CAPACITY_REACHED";
  }

  const available =
    reason === "AVAILABLE";

  return {
    available,
    reason,

    message:
      buildAvailabilityMessage(
        reason,
        remainingCapacity,
      ),

    requestedSlot,
    capacity,

    conflicts: {
      bookings: bookingConflicts,
      blockedTimes:
        blockedTimeConflicts,
    },
  };
}
