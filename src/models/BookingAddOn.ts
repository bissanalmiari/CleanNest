import "server-only";

import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType,
  type Model,
} from "mongoose";

const bookingAddonSchema = new Schema(
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

    addonId: {
      type: Schema.Types.ObjectId,
      ref: "Addon",
      required: [
        true,
        "Add-on is required.",
      ],
      index: true,
    },

    /*
     * A snapshot of the add-on name at booking time.
     * This protects booking history if the admin later
     * renames the original add-on.
     */
    addonName: {
      type: String,
      required: [
        true,
        "Add-on name is required.",
      ],
      trim: true,
      maxlength: [
        100,
        "Add-on name cannot exceed 100 characters.",
      ],
    },

    quantity: {
      type: Number,
      required: true,
      min: [
        1,
        "Add-on quantity must be at least one.",
      ],
      max: [
        50,
        "Add-on quantity cannot exceed 50.",
      ],
      default: 1,
    },

    /*
     * Trusted server-side price snapshot.
     * This must come from bookingPriceService.
     */
    unitPrice: {
      type: Number,
      required: [
        true,
        "Add-on unit price is required.",
      ],
      min: [
        0,
        "Add-on unit price cannot be negative.",
      ],
    },

    lineTotal: {
      type: Number,
      required: [
        true,
        "Add-on line total is required.",
      ],
      min: [
        0,
        "Add-on line total cannot be negative.",
      ],
    },

    unitExtraDurationMinutes: {
      type: Number,
      required: true,
      min: [
        0,
        "Extra duration cannot be negative.",
      ],
      max: [
        1440,
        "Extra duration cannot exceed 24 hours.",
      ],
      default: 0,
    },

    totalExtraDurationMinutes: {
      type: Number,
      required: true,
      min: [
        0,
        "Total extra duration cannot be negative.",
      ],
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/*
 * Always calculate totals on the server instead of
 * trusting values submitted by the frontend.
 */
bookingAddonSchema.pre(
  "validate",
  function calculateBookingAddonTotals() {
    const quantity =
      Number(this.quantity) || 0;

    const unitPrice =
      Number(this.unitPrice) || 0;

    const unitDuration =
      Number(
        this.unitExtraDurationMinutes,
      ) || 0;

    this.lineTotal =
      Math.round(
        quantity *
          unitPrice *
          100,
      ) / 100;

    this.totalExtraDurationMinutes =
      quantity * unitDuration;
  },
);

/*
 * The same add-on can only appear once in a booking.
 * Quantity handles repeated selections.
 */
bookingAddonSchema.index(
  {
    bookingId: 1,
    addonId: 1,
  },
  {
    unique: true,
  },
);

bookingAddonSchema.index({
  bookingId: 1,
  createdAt: 1,
});

export type BookingAddon =
  InferSchemaType<
    typeof bookingAddonSchema
  >;

export type BookingAddonDocument =
  HydratedDocument<BookingAddon>;

const BookingAddonModel =
  (models.BookingAddon as
    | Model<BookingAddon>
    | undefined) ??
  model<BookingAddon>(
    "BookingAddon",
    bookingAddonSchema,
  );

export default BookingAddonModel;