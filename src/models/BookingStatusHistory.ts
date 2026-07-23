import "server-only";

import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType,
  type Model,
} from "mongoose";

import type { BookingStatus } from "@/types/enums";

const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
] as const satisfies readonly BookingStatus[];

const bookingStatusHistorySchema =
  new Schema(
    {
      bookingId: {
        type: Schema.Types.ObjectId,
        ref: "Booking",
        required: [
          true,
          "Booking is required.",
        ],
        index: true,
      },

      /*
       * This is undefined when the booking is first
       * created and receives its initial status.
       */
      previousStatus: {
        type: String,
        enum: {
          values: BOOKING_STATUSES,
          message:
            "Previous booking status is invalid.",
        },
        default: undefined,
      },

      newStatus: {
        type: String,
        enum: {
          values: BOOKING_STATUSES,
          message:
            "New booking status is invalid.",
        },
        required: [
          true,
          "New booking status is required.",
        ],
        index: true,
      },

      changedByUserId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [
          true,
          "The user who changed the booking status is required.",
        ],
      },

      /*
       * Examples:
       * - Booking created
       * - Confirmed by administrator
       * - Cancelled by customer
       * - Service completed
       */
      reason: {
        type: String,
        trim: true,
        maxlength: [
          500,
          "Status-change reason cannot exceed 500 characters.",
        ],
        default: "",
      },

      /*
       * Optional extra information for audit purposes.
       * Do not store passwords, tokens, or private
       * payment-card information here.
       */
      metadata: {
        type: Schema.Types.Mixed,
        default: undefined,
      },
    },
    {
      timestamps: {
        createdAt: true,
        updatedAt: false,
      },
      versionKey: false,
    },
  );

/*
 * Prevent history records that claim a booking changed
 * from a status to the same status.
 */
bookingStatusHistorySchema.pre(
  "validate",
  function validateStatusChange() {
    if (
      this.previousStatus !== undefined &&
      this.previousStatus ===
        this.newStatus
    ) {
      this.invalidate(
        "newStatus",
        "The new booking status must be different from the previous status.",
      );
    }
  },
);

/*
 * Used to display a booking timeline from oldest
 * event to newest event.
 */
bookingStatusHistorySchema.index({
  bookingId: 1,
  createdAt: 1,
});

/*
 * Used by admin reports and status activity queries.
 */
bookingStatusHistorySchema.index({
  newStatus: 1,
  createdAt: -1,
});

export type BookingStatusHistory =
  InferSchemaType<
    typeof bookingStatusHistorySchema
  >;

export type BookingStatusHistoryDocument =
  HydratedDocument<BookingStatusHistory>;

const BookingStatusHistoryModel =
  (models.BookingStatusHistory as
    | Model<BookingStatusHistory>
    | undefined) ??
  model<BookingStatusHistory>(
    "BookingStatusHistory",
    bookingStatusHistorySchema,
  );

export default BookingStatusHistoryModel;