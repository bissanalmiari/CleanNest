import "server-only";

import mongoose, {
  Schema,
  type Document,
  type Model,
  type Types,
} from "mongoose";

import type {
  BookingFrequency,
  BookingSource,
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  PropertyType,
} from "@/types/enums";

const BOOKING_SOURCES = [
  "customer",
  "admin",
] as const;

const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
] as const;

const BOOKING_FREQUENCIES = [
  "one_time",
  "weekly",
  "biweekly",
  "monthly",
] as const;

const PROPERTY_TYPES = [
  "apartment",
  "house",
  "office",
  "other",
] as const;

const PAYMENT_METHODS = [
  "cash",
  "card",
] as const;

const PAYMENT_STATUSES = [
  "unpaid",
  "pending",
  "paid",
  "refunded",
  "failed",
] as const;

const TIME_PATTERN =
  /^([01]\d|2[0-3]):([0-5]\d)$/;

export interface IBooking
  extends Document {
  bookingNumber: string;

  customerId: Types.ObjectId;
  serviceId: Types.ObjectId;
  addressId: Types.ObjectId;
  createdByUserId: Types.ObjectId;
  serviceAreaId: Types.ObjectId;
  promoCodeId?: Types.ObjectId;

  source: BookingSource;
  status: BookingStatus;
  frequency: BookingFrequency;

  bookingDate: Date;
  startTime: string;
  endTime: string;
  estimatedDurationMinutes?: number;

  propertyType: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  propertySize?: number;

  /*
   * Trusted server-side pricing snapshot.
   */
  baseAmount: number;
  addOnsAmount: number;
  serviceAreaFee: number;
  discountAmount: number;
  totalAmount: number;

  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;

  /*
   * There is no cleaner account.
   * The admin manually assigns the cleaner name.
   */
  assignedCleanerName?: string;

  customerNotes?: string;
  adminNotes?: string;

  cancellationReason?: string;
  cancelledAt?: Date;
  cancelledByUserId?: Types.ObjectId;

  rescheduleCount: number;
  lastRescheduledAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema =
  new Schema<IBooking>(
    {
      bookingNumber: {
        type: String,
        required: [
          true,
          "Booking number is required.",
        ],
        unique: true,
        immutable: true,
        trim: true,
        uppercase: true,
        maxlength: [
          40,
          "Booking number cannot exceed 40 characters.",
        ],
      },

      customerId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [
          true,
          "Customer is required.",
        ],
        index: true,
      },

      serviceId: {
        type: Schema.Types.ObjectId,
        ref: "Service",
        required: [
          true,
          "Service is required.",
        ],
        index: true,
      },

      addressId: {
        type: Schema.Types.ObjectId,
        ref: "Address",
        required: [
          true,
          "Address is required.",
        ],
      },

      createdByUserId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [
          true,
          "The user who created the booking is required.",
        ],
      },

      serviceAreaId: {
        type: Schema.Types.ObjectId,
        ref: "ServiceArea",
        required: [
          true,
          "Service area is required.",
        ],
        index: true,
      },

      promoCodeId: {
        type: Schema.Types.ObjectId,
        ref: "PromoCode",
        default: undefined,
      },

      source: {
        type: String,
        enum: {
          values: BOOKING_SOURCES,
          message:
            "Invalid booking source.",
        },
        default: "customer",
        required: true,
      },

      status: {
        type: String,
        enum: {
          values: BOOKING_STATUSES,
          message:
            "Invalid booking status.",
        },
        default: "pending",
        required: true,
        index: true,
      },

      frequency: {
        type: String,
        enum: {
          values:
            BOOKING_FREQUENCIES,
          message:
            "Invalid booking frequency.",
        },
        default: "one_time",
        required: true,
      },

      bookingDate: {
        type: Date,
        required: [
          true,
          "Booking date is required.",
        ],
        index: true,
      },

      startTime: {
        type: String,
        required: [
          true,
          "Start time is required.",
        ],
        trim: true,
        match: [
          TIME_PATTERN,
          "Start time must use the HH:mm format.",
        ],
      },

      endTime: {
        type: String,
        required: [
          true,
          "End time is required.",
        ],
        trim: true,
        match: [
          TIME_PATTERN,
          "End time must use the HH:mm format.",
        ],
      },

      estimatedDurationMinutes: {
        type: Number,
        min: [
          1,
          "Estimated duration must be at least one minute.",
        ],
        max: [
          1440,
          "Estimated duration cannot exceed 24 hours.",
        ],
        default: undefined,
      },

      propertyType: {
        type: String,
        enum: {
          values: PROPERTY_TYPES,
          message:
            "Invalid property type.",
        },
        required: [
          true,
          "Property type is required.",
        ],
      },

      bedrooms: {
        type: Number,
        min: [
          0,
          "Bedrooms cannot be negative.",
        ],
        max: [
          30,
          "Bedrooms cannot exceed 30.",
        ],
        default: undefined,
      },

      bathrooms: {
        type: Number,
        min: [
          0,
          "Bathrooms cannot be negative.",
        ],
        max: [
          30,
          "Bathrooms cannot exceed 30.",
        ],
        default: undefined,
      },

      propertySize: {
        type: Number,
        min: [
          1,
          "Property size must be greater than zero.",
        ],
        max: [
          100000,
          "Property size is too large.",
        ],
        default: undefined,
      },

      baseAmount: {
        type: Number,
        required: true,
        min: [
          0,
          "Base amount cannot be negative.",
        ],
        default: 0,
      },

      addOnsAmount: {
        type: Number,
        required: true,
        min: [
          0,
          "Add-ons amount cannot be negative.",
        ],
        default: 0,
      },

      serviceAreaFee: {
        type: Number,
        required: true,
        min: [
          0,
          "Service-area fee cannot be negative.",
        ],
        default: 0,
      },

      discountAmount: {
        type: Number,
        required: true,
        min: [
          0,
          "Discount amount cannot be negative.",
        ],
        default: 0,
      },

      totalAmount: {
        type: Number,
        required: [
          true,
          "Total amount is required.",
        ],
        min: [
          0,
          "Total amount cannot be negative.",
        ],
        default: 0,
      },

      paymentMethod: {
        type: String,
        enum: {
          values: PAYMENT_METHODS,
          message:
            "Payment method must be cash or card.",
        },
        required: [
          true,
          "Payment method is required.",
        ],
      },

      paymentStatus: {
        type: String,
        enum: {
          values: PAYMENT_STATUSES,
          message:
            "Invalid payment status.",
        },
        default: "unpaid",
        required: true,
      },

      assignedCleanerName: {
        type: String,
        trim: true,
        minlength: [
          2,
          "Cleaner name must contain at least two characters.",
        ],
        maxlength: [
          120,
          "Cleaner name cannot exceed 120 characters.",
        ],
        default: undefined,
      },

      customerNotes: {
        type: String,
        trim: true,
        maxlength: [
          1000,
          "Customer notes cannot exceed 1000 characters.",
        ],
        default: undefined,
      },

      adminNotes: {
        type: String,
        trim: true,
        maxlength: [
          2000,
          "Admin notes cannot exceed 2000 characters.",
        ],
        default: undefined,
      },

      cancellationReason: {
        type: String,
        trim: true,
        maxlength: [
          500,
          "Cancellation reason cannot exceed 500 characters.",
        ],
        default: undefined,
      },

      cancelledAt: {
        type: Date,
        default: undefined,
      },

      cancelledByUserId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: undefined,
      },

      rescheduleCount: {
        type: Number,
        required: true,
        min: [
          0,
          "Reschedule count cannot be negative.",
        ],
        default: 0,
      },

      lastRescheduledAt: {
        type: Date,
        default: undefined,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    },
  );

function timeToMinutes(
  value: string,
) {
  const [hours = 0, minutes = 0] =
    value.split(":").map(Number);

  return hours * 60 + minutes;
}

function roundMoney(
  value: number,
) {
  return (
    Math.round(
      (value + Number.EPSILON) *
        100,
    ) / 100
  );
}

/*
 * Validate the relationship between
 * the start and end times.
 */
bookingSchema.pre(
  "validate",
  function validateBookingTimes() {
    if (
      !this.startTime ||
      !this.endTime
    ) {
      return;
    }

    if (
      !TIME_PATTERN.test(
        this.startTime,
      ) ||
      !TIME_PATTERN.test(
        this.endTime,
      )
    ) {
      return;
    }

    const startMinutes =
      timeToMinutes(
        this.startTime,
      );

    const endMinutes =
      timeToMinutes(
        this.endTime,
      );

    if (
      endMinutes <= startMinutes
    ) {
      this.invalidate(
        "endTime",
        "End time must be later than start time.",
      );

      return;
    }

    this.estimatedDurationMinutes =
      endMinutes - startMinutes;
  },
);

/*
 * Calculate and validate the trusted
 * booking total.
 *
 * totalAmount =
 * baseAmount
 * + addOnsAmount
 * + serviceAreaFee
 * - discountAmount
 */
bookingSchema.pre(
  "validate",
  function validateBookingPricing() {
    const baseAmount =
      Number(this.baseAmount) || 0;

    const addOnsAmount =
      Number(this.addOnsAmount) || 0;

    const serviceAreaFee =
      Number(
        this.serviceAreaFee,
      ) || 0;

    const discountAmount =
      Number(
        this.discountAmount,
      ) || 0;

    const subtotal =
      baseAmount +
      addOnsAmount +
      serviceAreaFee;

    if (
      discountAmount > subtotal
    ) {
      this.invalidate(
        "discountAmount",
        "Discount cannot exceed the booking subtotal.",
      );

      return;
    }

    this.baseAmount =
      roundMoney(baseAmount);

    this.addOnsAmount =
      roundMoney(addOnsAmount);

    this.serviceAreaFee =
      roundMoney(
        serviceAreaFee,
      );

    this.discountAmount =
      roundMoney(
        discountAmount,
      );

    this.totalAmount =
      roundMoney(
        Math.max(
          0,
          subtotal -
            discountAmount,
        ),
      );
  },
);

/*
 * Cancellation information should only
 * exist for cancelled bookings.
 */
bookingSchema.pre(
  "validate",
  function validateCancellationData() {
    if (
      this.status === "cancelled"
    ) {
      if (!this.cancelledAt) {
        this.cancelledAt =
          new Date();
      }

      return;
    }

    /*
     * At this point TypeScript already knows
     * the status is not "cancelled".
     */
    if (this.isModified("status")) {
      this.cancellationReason =
        undefined;

      this.cancelledAt =
        undefined;

      this.cancelledByUserId =
        undefined;
    }
  },
);

/*
 * Customer dashboard and booking history.
 */
bookingSchema.index({
  customerId: 1,
  bookingDate: -1,
});

/*
 * Admin booking queue and reports.
 */
bookingSchema.index({
  status: 1,
  bookingDate: 1,
});

/*
 * Availability checking by service area.
 */
bookingSchema.index({
  serviceAreaId: 1,
  bookingDate: 1,
  startTime: 1,
  endTime: 1,
  status: 1,
});

/*
 * Service booking reports.
 */
bookingSchema.index({
  serviceId: 1,
  bookingDate: 1,
});

/*
 * Cleaner-name search from the admin dashboard.
 */
bookingSchema.index({
  assignedCleanerName: 1,
  bookingDate: 1,
});

const BookingModel =
  (mongoose.models.Booking as
    | Model<IBooking>
    | undefined) ??
  mongoose.model<IBooking>(
    "Booking",
    bookingSchema,
  );

export default BookingModel;