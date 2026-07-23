import { z } from "zod";

import type {
  BookingFrequency,
  BookingStatus,
  PaymentMethod,
  PropertyType,
} from "@/types/enums";

/*
 * CleanNest operates in Lebanon.
 * Booking dates and times are interpreted using Beirut time.
 */
export const CLEAN_NEST_TIME_ZONE =
  "Asia/Beirut";

export const BOOKING_CHANGE_LIMIT_HOURS =
  24;

const BOOKING_FREQUENCIES = [
  "one_time",
  "weekly",
  "biweekly",
  "monthly",
] as const satisfies readonly BookingFrequency[];

const PROPERTY_TYPES = [
  "apartment",
  "house",
  "office",
  "other",
] as const satisfies readonly PropertyType[];

const PAYMENT_METHODS = [
  "cash",
  "card",
] as const satisfies readonly PaymentMethod[];

const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
] as const satisfies readonly BookingStatus[];

const DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}$/;

const TIME_PATTERN =
  /^([01]\d|2[0-3]):([0-5]\d)$/;

const MONGODB_ID_PATTERN =
  /^[a-f\d]{24}$/i;

const objectIdSchema = z
  .string()
  .trim()
  .regex(
    MONGODB_ID_PATTERN,
    "A valid MongoDB ID is required.",
  );

const optionalObjectIdSchema = z
  .string()
  .trim()
  .regex(
    MONGODB_ID_PATTERN,
    "A valid MongoDB ID is required.",
  )
  .optional()
  .or(z.literal(""));

const timeSchema = z
  .string()
  .trim()
  .regex(
    TIME_PATTERN,
    "Time must use the HH:mm format.",
  );

const bookingDateSchema = z
  .string()
  .trim()
  .regex(
    DATE_PATTERN,
    "Date must use the YYYY-MM-DD format.",
  )
  .refine(
    (value) => isValidCalendarDate(value),
    "The selected date is invalid.",
  );

const optionalText = (
  maximumLength: number,
  message: string,
) =>
  z
    .string()
    .trim()
    .max(maximumLength, message)
    .optional()
    .or(z.literal(""));

export interface BookingChangeWindowResult {
  allowed: boolean;
  scheduledAt: Date;
  millisecondsUntilBooking: number;
  hoursUntilBooking: number;
  reason?: string;
}

interface BookingChangeWindowInput {
  bookingDate: Date | string;
  startTime: string;
  status: BookingStatus;
  now?: Date;
}

function isValidCalendarDate(
  value: string,
) {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);

  if (
    year === undefined ||
    month === undefined ||
    day === undefined
  ) {
    return false;
  }

  const parsedDate = new Date(
    Date.UTC(year, month - 1, day),
  );

  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() ===
    month - 1 &&
    parsedDate.getUTCDate() === day
  );
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value
    .split(":")
    .map(Number);

  return (
    (hours ?? 0) * 60 +
    (minutes ?? 0)
  );
}

function formatDateInTimeZone(
  date: Date,
  timeZone: string,
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
    throw new Error(
      "Unable to format the booking date.",
    );
  }

  return `${year}-${month}-${day}`;
}

/*
 * Finds the time-zone offset for a particular
 * instant using the built-in Intl API.
 */
function getTimeZoneOffsetMilliseconds(
  date: Date,
  timeZone: string,
) {
  const formatter =
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });

  const parts =
    formatter.formatToParts(date);

  const values = new Map(
    parts.map((part) => [
      part.type,
      part.value,
    ]),
  );

  const year = Number(
    values.get("year"),
  );

  const month = Number(
    values.get("month"),
  );

  const day = Number(values.get("day"));

  const hour = Number(
    values.get("hour"),
  );

  const minute = Number(
    values.get("minute"),
  );

  const second = Number(
    values.get("second"),
  );

  const representedUtcTime = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    second,
  );

  return representedUtcTime - date.getTime();
}

/*
 * Converts a date and time entered in Lebanon
 * into an absolute JavaScript Date.
 *
 * The second calculation handles daylight-saving
 * changes that can occur around the selected date.
 */
export function bookingDateTimeToUtc(
  bookingDate: string,
  time: string,
  timeZone = CLEAN_NEST_TIME_ZONE,
) {
  if (
    !isValidCalendarDate(bookingDate) ||
    !TIME_PATTERN.test(time)
  ) {
    throw new Error(
      "Invalid booking date or time.",
    );
  }

  const [year, month, day] =
    bookingDate.split("-").map(Number);

  const [hour, minute] =
    time.split(":").map(Number);

  const initialUtcGuess = new Date(
    Date.UTC(
      year ?? 0,
      (month ?? 1) - 1,
      day ?? 1,
      hour ?? 0,
      minute ?? 0,
      0,
      0,
    ),
  );

  const firstOffset =
    getTimeZoneOffsetMilliseconds(
      initialUtcGuess,
      timeZone,
    );

  const adjustedDate = new Date(
    initialUtcGuess.getTime() -
    firstOffset,
  );

  const secondOffset =
    getTimeZoneOffsetMilliseconds(
      adjustedDate,
      timeZone,
    );

  return new Date(
    initialUtcGuess.getTime() -
    secondOffset,
  );
}

function validateSchedule(
  values: {
    bookingDate: string;
    startTime: string;
    endTime: string;
  },
  context: z.RefinementCtx,
) {
  const startMinutes = timeToMinutes(
    values.startTime,
  );

  const endMinutes = timeToMinutes(
    values.endTime,
  );

  if (endMinutes <= startMinutes) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endTime"],
      message:
        "End time must be later than start time.",
    });
  }

  try {
    const scheduledStart =
      bookingDateTimeToUtc(
        values.bookingDate,
        values.startTime,
      );

    if (
      scheduledStart.getTime() <=
      Date.now()
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bookingDate"],
        message:
          "The booking must be scheduled for a future date and time.",
      });
    }
  } catch {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["bookingDate"],
      message:
        "The selected booking date and time are invalid.",
    });
  }
}

export const bookingPropertySchema =
  z
    .object({
      propertyType: z.enum(
        PROPERTY_TYPES,
      ),

      bedrooms: z.coerce
        .number()
        .int(
          "Bedrooms must be a whole number.",
        )
        .min(
          0,
          "Bedrooms cannot be negative.",
        )
        .max(
          30,
          "Bedrooms cannot exceed 30.",
        )
        .optional(),

      bathrooms: z.coerce
        .number()
        .int(
          "Bathrooms must be a whole number.",
        )
        .min(
          0,
          "Bathrooms cannot be negative.",
        )
        .max(
          30,
          "Bathrooms cannot exceed 30.",
        )
        .optional(),

      propertySize: z.coerce
        .number()
        .positive(
          "Property size must be greater than zero.",
        )
        .max(
          100000,
          "Property size is too large.",
        )
        .optional(),
    })
    .superRefine((property, context) => {
      if (
        property.propertyType ===
        "apartment" ||
        property.propertyType ===
        "house"
      ) {
        if (
          property.bedrooms ===
          undefined
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: ["bedrooms"],
            message:
              "The number of bedrooms is required.",
          });
        }

        if (
          property.bathrooms ===
          undefined
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: ["bathrooms"],
            message:
              "The number of bathrooms is required.",
          });
        }
      }

      if (
        property.propertyType ===
        "office" &&
        property.propertySize ===
        undefined
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["propertySize"],
          message:
            "Office size is required.",
        });
      }
    });

export const bookingAddOnSelectionSchema =
  z.object({
    addOnId: objectIdSchema,

    quantity: z.coerce
      .number()
      .int(
        "Add-on quantity must be a whole number.",
      )
      .min(
        1,
        "Add-on quantity must be at least one.",
      )
      .max(
        20,
        "Add-on quantity cannot exceed 20.",
      ),
  });

const bookingSelectionFields = {
  serviceId: objectIdSchema,
  addressId: objectIdSchema,
  serviceAreaId: objectIdSchema,

  promoCodeId:
    optionalObjectIdSchema,

  frequency: z
    .enum(BOOKING_FREQUENCIES)
    .default("one_time"),

  property: bookingPropertySchema,

  addOns: z
    .array(
      bookingAddOnSelectionSchema,
    )
    .max(
      20,
      "A booking cannot contain more than 20 add-ons.",
    )
    .default([]),

  paymentMethod:
    z.enum(PAYMENT_METHODS),

  customerNotes: optionalText(
    1000,
    "Customer notes cannot exceed 1000 characters.",
  ),
};

const bookingScheduleFields = {
  bookingDate: bookingDateSchema,
  startTime: timeSchema,
  endTime: timeSchema,
};

const createBookingBaseSchema =
  z.object({
    ...bookingSelectionFields,
    ...bookingScheduleFields,
  });

export const createBookingSchema =
  createBookingBaseSchema.superRefine(
    (values, context) => {
      validateSchedule(values, context);

      const uniqueAddOnIds = new Set(
        values.addOns.map(
          (addOn) => addOn.addOnId,
        ),
      );

      if (
        uniqueAddOnIds.size !==
        values.addOns.length
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["addOns"],
          message:
            "The same add-on cannot be selected more than once.",
        });
      }
    },
  );

export const adminCreateBookingSchema =
  createBookingBaseSchema
    .extend({
      customerId: objectIdSchema,

      assignedCleanerName:
        optionalText(
          120,
          "Cleaner name cannot exceed 120 characters.",
        ),

      adminNotes: optionalText(
        2000,
        "Admin notes cannot exceed 2000 characters.",
      ),
    })
    .superRefine(
      (values, context) => {
        validateSchedule(
          values,
          context,
        );

        const uniqueAddOnIds =
          new Set(
            values.addOns.map(
              (addOn) =>
                addOn.addOnId,
            ),
          );

        if (
          uniqueAddOnIds.size !==
          values.addOns.length
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,
            path: ["addOns"],
            message:
              "The same add-on cannot be selected more than once.",
          });
        }
      },
    );

/*
 * Scheduling changes are handled by the dedicated
 * reschedule endpoint. The normal edit endpoint can
 * update property details, add-ons, address, notes,
 * payment method, and promo code.
 */
export const editBookingSchema =
  z
    .object({
      addressId:
        objectIdSchema.optional(),

      serviceAreaId:
        objectIdSchema.optional(),

      promoCodeId:
        optionalObjectIdSchema,

      property:
        bookingPropertySchema.optional(),

      addOns: z
        .array(
          bookingAddOnSelectionSchema,
        )
        .max(
          20,
          "A booking cannot contain more than 20 add-ons.",
        )
        .optional(),

      paymentMethod:
        z
          .enum(PAYMENT_METHODS)
          .optional(),

      customerNotes: optionalText(
        1000,
        "Customer notes cannot exceed 1000 characters.",
      ),
    })
    .strict()
    .superRefine(
      (values, context) => {
        if (
          values.addOns !== undefined
        ) {
          const uniqueAddOnIds =
            new Set(
              values.addOns.map(
                (addOn) =>
                  addOn.addOnId,
              ),
            );

          if (
            uniqueAddOnIds.size !==
            values.addOns.length
          ) {
            context.addIssue({
              code:
                z.ZodIssueCode.custom,
              path: ["addOns"],
              message:
                "The same add-on cannot be selected more than once.",
            });
          }
        }

        const hasAtLeastOneValue =
          Object.values(
            values,
          ).some(
            (value) =>
              value !== undefined,
          );

        if (!hasAtLeastOneValue) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,
            message:
              "At least one booking field must be provided.",
          });
        }
      },
    );

export const cancelBookingSchema =
  z.object({
    reason: z
      .string()
      .trim()
      .min(
        3,
        "Please provide a cancellation reason.",
      )
      .max(
        500,
        "Cancellation reason cannot exceed 500 characters.",
      ),
  });

export const rescheduleBookingSchema =
  z
    .object({
      ...bookingScheduleFields,
      reason: optionalText(
        500,
        "Rescheduling reason cannot exceed 500 characters.",
      ),
    })
    .superRefine(
      (values, context) => {
        validateSchedule(
          values,
          context,
        );
      },
    );

export const availabilityQuerySchema =
  z
    .object({
      serviceId: objectIdSchema,
      serviceAreaId: objectIdSchema,
      ...bookingScheduleFields,

      excludeBookingId:
        objectIdSchema.optional(),
    })
    .superRefine(
      (values, context) => {
        validateSchedule(
          values,
          context,
        );
      },
    );

/*
 * The client sends booking selections only.
 * The server looks up all prices from the database.
 */
export const bookingPricePreviewSchema =
  z.object({
    serviceId: objectIdSchema,

    promoCodeId:
      optionalObjectIdSchema,

    property:
      bookingPropertySchema,

    addOns: z
      .array(
        bookingAddOnSelectionSchema,
      )
      .max(
        20,
        "A booking cannot contain more than 20 add-ons.",
      )
      .default([]),

    frequency: z
      .enum(BOOKING_FREQUENCIES)
      .default("one_time"),
  });

export const assignCleanerNameSchema =
  z.object({
    /*
     * Empty string or null removes the current
     * cleaner-name assignment.
     */
    assignedCleanerName: z
      .union([
        z
          .string()
          .trim()
          .max(
            120,
            "Cleaner name cannot exceed 120 characters.",
          )
          .refine(
            (value) =>
              value.length === 0 ||
              value.length >= 2,
            "Cleaner name must contain at least two characters.",
          ),

        z.null(),
      ]),

    note: z
      .string()
      .trim()
      .max(
        500,
        "Assignment note cannot exceed 500 characters.",
      )
      .optional()
      .or(z.literal("")),
  });

export const adminBookingUpdateSchema =
  z.object({
    status: z
      .enum(BOOKING_STATUSES)
      .optional(),

    assignedCleanerName:
      optionalText(
        120,
        "Cleaner name cannot exceed 120 characters.",
      ),

    adminNotes: optionalText(
      2000,
      "Admin notes cannot exceed 2000 characters.",
    ),
  });

export const bookingIdParamsSchema =
  z.object({
    bookingId: objectIdSchema,
  });

/*
 * Used before customer cancellation or rescheduling.
 */
export function checkBookingChangeWindow({
  bookingDate,
  startTime,
  status,
  now = new Date(),
}: BookingChangeWindowInput): BookingChangeWindowResult {
  const dateText =
    bookingDate instanceof Date
      ? formatDateInTimeZone(
        bookingDate,
        CLEAN_NEST_TIME_ZONE,
      )
      : bookingDate.slice(0, 10);

  const scheduledAt =
    bookingDateTimeToUtc(
      dateText,
      startTime,
    );

  const millisecondsUntilBooking =
    scheduledAt.getTime() -
    now.getTime();

  const hoursUntilBooking =
    millisecondsUntilBooking /
    (1000 * 60 * 60);

  if (status === "cancelled") {
    return {
      allowed: false,
      scheduledAt,
      millisecondsUntilBooking,
      hoursUntilBooking,
      reason:
        "This booking has already been cancelled.",
    };
  }

  if (status === "completed") {
    return {
      allowed: false,
      scheduledAt,
      millisecondsUntilBooking,
      hoursUntilBooking,
      reason:
        "A completed booking cannot be changed.",
    };
  }

  if (status === "in_progress") {
    return {
      allowed: false,
      scheduledAt,
      millisecondsUntilBooking,
      hoursUntilBooking,
      reason:
        "A booking in progress cannot be changed.",
    };
  }

  if (
    millisecondsUntilBooking <= 0
  ) {
    return {
      allowed: false,
      scheduledAt,
      millisecondsUntilBooking,
      hoursUntilBooking,
      reason:
        "This booking has already started.",
    };
  }

  if (
    hoursUntilBooking <
    BOOKING_CHANGE_LIMIT_HOURS
  ) {
    return {
      allowed: false,
      scheduledAt,
      millisecondsUntilBooking,
      hoursUntilBooking,
      reason:
        "Bookings can only be cancelled or rescheduled at least 24 hours before the scheduled start time.",
    };
  }

  return {
    allowed: true,
    scheduledAt,
    millisecondsUntilBooking,
    hoursUntilBooking,
  };
}

export type CreateBookingInput =
  z.infer<
    typeof createBookingSchema
  >;

export type AdminCreateBookingInput =
  z.infer<
    typeof adminCreateBookingSchema
  >;

export type EditBookingInput =
  z.infer<
    typeof editBookingSchema
  >;

export type CancelBookingInput =
  z.infer<
    typeof cancelBookingSchema
  >;

export type RescheduleBookingInput =
  z.infer<
    typeof rescheduleBookingSchema
  >;

export type AvailabilityQueryInput =
  z.infer<
    typeof availabilityQuerySchema
  >;

export type BookingPricePreviewInput =
  z.infer<
    typeof bookingPricePreviewSchema
  >;

export type AssignCleanerNameInput =
  z.infer<
    typeof assignCleanerNameSchema
  >;

export type AdminBookingUpdateInput =
  z.infer<
    typeof adminBookingUpdateSchema
  >;