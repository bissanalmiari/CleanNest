import "server-only";

import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

const RESCHEDULE_SOURCES = ["customer", "admin"] as const;

export type RescheduleSource = (typeof RESCHEDULE_SOURCES)[number];

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export interface IBookingRescheduleHistory extends Document {
  bookingId: Types.ObjectId;

  previousBookingDate: Date;
  previousStartTime: string;
  previousEndTime: string;

  newBookingDate: Date;
  newStartTime: string;
  newEndTime: string;

  previousDurationMinutes: number;
  newDurationMinutes: number;

  reason?: string;

  changedByUserId: Types.ObjectId;
  source: RescheduleSource;

  createdAt: Date;
}

const bookingRescheduleHistorySchema = new Schema<IBookingRescheduleHistory>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking is required."],
      index: true,
    },

    previousBookingDate: {
      type: Date,
      required: [true, "Previous booking date is required."],
    },

    previousStartTime: {
      type: String,
      required: [true, "Previous start time is required."],
      trim: true,
      match: [TIME_PATTERN, "Previous start time must use the HH:mm format."],
    },

    previousEndTime: {
      type: String,
      required: [true, "Previous end time is required."],
      trim: true,
      match: [TIME_PATTERN, "Previous end time must use the HH:mm format."],
    },

    newBookingDate: {
      type: Date,
      required: [true, "New booking date is required."],
    },

    newStartTime: {
      type: String,
      required: [true, "New start time is required."],
      trim: true,
      match: [TIME_PATTERN, "New start time must use the HH:mm format."],
    },

    newEndTime: {
      type: String,
      required: [true, "New end time is required."],
      trim: true,
      match: [TIME_PATTERN, "New end time must use the HH:mm format."],
    },

    previousDurationMinutes: {
      type: Number,
      required: true,
      min: [1, "Previous duration must be at least one minute."],
      max: [1440, "Previous duration cannot exceed 24 hours."],
    },

    newDurationMinutes: {
      type: Number,
      required: true,
      min: [1, "New duration must be at least one minute."],
      max: [1440, "New duration cannot exceed 24 hours."],
    },

    reason: {
      type: String,
      trim: true,
      maxlength: [500, "Rescheduling reason cannot exceed 500 characters."],
      default: "",
    },

    changedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "The user who rescheduled the booking is required."],
    },

    source: {
      type: String,
      enum: {
        values: RESCHEDULE_SOURCES,
        message: "Reschedule source must be customer or admin.",
      },
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
    versionKey: false,
  }
);

function timeToMinutes(value: string) {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);

  return hours * 60 + minutes;
}

/*
 * Validate the previous and new time ranges.
 */
bookingRescheduleHistorySchema.pre("validate", function validateTimeRanges() {
  if (
    this.previousStartTime &&
    this.previousEndTime &&
    TIME_PATTERN.test(this.previousStartTime) &&
    TIME_PATTERN.test(this.previousEndTime)
  ) {
    const previousStart = timeToMinutes(this.previousStartTime);

    const previousEnd = timeToMinutes(this.previousEndTime);

    if (previousEnd <= previousStart) {
      this.invalidate(
        "previousEndTime",
        "Previous end time must be later than the previous start time."
      );
    }
  }

  if (
    this.newStartTime &&
    this.newEndTime &&
    TIME_PATTERN.test(this.newStartTime) &&
    TIME_PATTERN.test(this.newEndTime)
  ) {
    const newStart = timeToMinutes(this.newStartTime);

    const newEnd = timeToMinutes(this.newEndTime);

    if (newEnd <= newStart) {
      this.invalidate("newEndTime", "New end time must be later than the new start time.");
    }
  }
});

/*
 * Prevent history entries where the date and time
 * did not actually change.
 */
bookingRescheduleHistorySchema.pre("validate", function validateScheduleChanged() {
  if (!this.previousBookingDate || !this.newBookingDate) {
    return;
  }

  const sameDate = this.previousBookingDate.getTime() === this.newBookingDate.getTime();

  const sameStartTime = this.previousStartTime === this.newStartTime;

  const sameEndTime = this.previousEndTime === this.newEndTime;

  if (sameDate && sameStartTime && sameEndTime) {
    this.invalidate(
      "newStartTime",
      "The new booking schedule must be different from the previous schedule."
    );
  }
});

/*
 * Displays each booking's reschedule timeline
 * from oldest change to newest.
 */
bookingRescheduleHistorySchema.index({
  bookingId: 1,
  createdAt: 1,
});

/*
 * Used for admin rescheduling reports.
 */
bookingRescheduleHistorySchema.index({
  source: 1,
  createdAt: -1,
});

const BookingRescheduleHistoryModel =
  (mongoose.models.BookingRescheduleHistory as Model<IBookingRescheduleHistory> | undefined) ??
  mongoose.model<IBookingRescheduleHistory>(
    "BookingRescheduleHistory",
    bookingRescheduleHistorySchema
  );

export default BookingRescheduleHistoryModel;
