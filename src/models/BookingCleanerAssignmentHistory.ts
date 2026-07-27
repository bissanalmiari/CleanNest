import "server-only";

import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

const ASSIGNMENT_ACTIONS = ["assigned", "reassigned", "removed"] as const;

export type CleanerAssignmentAction = (typeof ASSIGNMENT_ACTIONS)[number];

export interface IBookingCleanerAssignmentHistory extends Document {
  bookingId: Types.ObjectId;

  previousCleanerName?: string;
  newCleanerName?: string;

  action: CleanerAssignmentAction;

  changedByUserId: Types.ObjectId;
  note?: string;

  createdAt: Date;
}

const bookingCleanerAssignmentHistorySchema = new Schema<IBookingCleanerAssignmentHistory>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking is required."],
      index: true,
    },

    /*
     * Only names are stored. There is no cleaner
     * account, cleaner ID, or cleaner dashboard.
     */
    previousCleanerName: {
      type: String,
      trim: true,
      maxlength: [120, "Previous cleaner name cannot exceed 120 characters."],
      default: undefined,
    },

    newCleanerName: {
      type: String,
      trim: true,
      maxlength: [120, "New cleaner name cannot exceed 120 characters."],
      default: undefined,
    },

    action: {
      type: String,
      enum: {
        values: ASSIGNMENT_ACTIONS,
        message: "Cleaner-assignment action is invalid.",
      },
      required: [true, "Cleaner-assignment action is required."],
      index: true,
    },

    changedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "The admin who changed the cleaner assignment is required."],
    },

    note: {
      type: String,
      trim: true,
      maxlength: [500, "Assignment note cannot exceed 500 characters."],
      default: undefined,
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

bookingCleanerAssignmentHistorySchema.pre("validate", function validateAssignmentHistory() {
  const previousName = this.previousCleanerName?.trim();

  const newName = this.newCleanerName?.trim();

  if (this.action === "assigned" && (previousName || !newName)) {
    this.invalidate(
      "action",
      "An assigned action requires a new cleaner name and no previous cleaner name."
    );
  }

  if (this.action === "reassigned" && (!previousName || !newName || previousName === newName)) {
    this.invalidate("action", "A reassigned action requires two different cleaner names.");
  }

  if (this.action === "removed" && (!previousName || newName)) {
    this.invalidate(
      "action",
      "A removed action requires a previous cleaner name and no new cleaner name."
    );
  }
});

/*
 * Display the cleaner-assignment timeline for
 * one booking from oldest to newest.
 */
bookingCleanerAssignmentHistorySchema.index({
  bookingId: 1,
  createdAt: 1,
});

/*
 * Admin audit reporting.
 */
bookingCleanerAssignmentHistorySchema.index({
  changedByUserId: 1,
  createdAt: -1,
});

bookingCleanerAssignmentHistorySchema.index({
  action: 1,
  createdAt: -1,
});

const BookingCleanerAssignmentHistoryModel =
  (mongoose.models.BookingCleanerAssignmentHistory as
    Model<IBookingCleanerAssignmentHistory> | undefined) ??
  mongoose.model<IBookingCleanerAssignmentHistory>(
    "BookingCleanerAssignmentHistory",
    bookingCleanerAssignmentHistorySchema
  );

export default BookingCleanerAssignmentHistoryModel;
