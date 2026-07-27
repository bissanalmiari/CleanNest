import "server-only";

import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

import type { PaymentMethod, PaymentStatus } from "@/types/enums";

const PAYMENT_METHODS = ["cash", "card"] as const satisfies readonly PaymentMethod[];

const PAYMENT_STATUSES = [
  "unpaid",
  "pending",
  "paid",
  "refunded",
  "failed",
] as const satisfies readonly PaymentStatus[];

const PAYMENT_PROVIDERS = ["cash", "test_card", "stripe"] as const;

export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export interface IPayment extends Document {
  bookingId: Types.ObjectId;

  amount: number;
  currency: "USD";

  method: PaymentMethod;
  provider: PaymentProvider;
  status: PaymentStatus;

  transactionReference?: string;

  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  stripeCustomerId?: string;

  paidAt?: Date;

  failureReason?: string;
  failedAt?: Date;

  refundAmount?: number;
  refundReason?: string;
  refundReference?: string;
  refundedAt?: Date;

  metadata?: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking is required."],
    },

    /*
     * Trusted booking total at the time the
     * payment record is created.
     */
    amount: {
      type: Number,
      required: [true, "Payment amount is required."],
      min: [0, "Payment amount cannot be negative."],
    },

    currency: {
      type: String,
      enum: {
        values: ["USD"],
        message: "CleanNest currently supports USD payments only.",
      },
      default: "USD",
      required: true,
    },

    method: {
      type: String,
      enum: {
        values: PAYMENT_METHODS,
        message: "Payment method must be cash or card.",
      },
      required: [true, "Payment method is required."],
      index: true,
    },

    /*
     * Cash bookings are paid after service.
     * Card bookings currently use the test-card flow.
     */
    provider: {
      type: String,
      enum: {
        values: PAYMENT_PROVIDERS,
        message: "Payment provider is invalid.",
      },
      required: true,
    },

    status: {
      type: String,
      enum: {
        values: PAYMENT_STATUSES,
        message: "Payment status is invalid.",
      },
      required: true,
      default: "unpaid",
      index: true,
    },

    transactionReference: {
      type: String,
      trim: true,
      maxlength: [150, "Transaction reference cannot exceed 150 characters."],
      default: undefined,
    },

    stripeCheckoutSessionId: {
      type: String,
      trim: true,
      default: undefined,
      index: true,
    },

    stripePaymentIntentId: {
      type: String,
      trim: true,
      default: undefined,
    },

    stripeCustomerId: {
      type: String,
      trim: true,
      default: undefined,
    },

    paidAt: {
      type: Date,
      default: undefined,
    },

    failureReason: {
      type: String,
      trim: true,
      maxlength: [500, "Payment failure reason cannot exceed 500 characters."],
      default: undefined,
    },

    failedAt: {
      type: Date,
      default: undefined,
    },

    /*
     * Refund information is stored on the same
     * payment because CleanNest currently uses one
     * payment record per booking.
     */
    refundAmount: {
      type: Number,
      min: [0, "Refund amount cannot be negative."],
      default: undefined,
    },

    refundReason: {
      type: String,
      trim: true,
      maxlength: [500, "Refund reason cannot exceed 500 characters."],
      default: undefined,
    },

    refundReference: {
      type: String,
      trim: true,
      maxlength: [150, "Refund reference cannot exceed 150 characters."],
      default: undefined,
    },

    refundedAt: {
      type: Date,
      default: undefined,
    },

    /*
     * May contain safe test-payment information.
     * Never store full card numbers, CVV values,
     * passwords, authentication tokens, or OTPs.
     */
    metadata: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/*
 * Validate provider and payment-method compatibility.
 */
paymentSchema.pre("validate", function validatePaymentProvider() {
  if (this.method === "cash" && this.provider !== "cash") {
    this.invalidate("provider", "Cash payments must use the cash provider.");
  }

  if (this.method === "card" && this.provider !== "test_card" && this.provider !== "stripe") {
    this.invalidate(
      "provider",
      "Card payments must use the Stripe (or legacy test-card) provider."
    );
  }
});

/*
 * Keep important payment timestamps synchronized
 * with the current payment status.
 */
paymentSchema.pre("validate", function validatePaymentStatus() {
  this.amount = roundMoney(Number(this.amount) || 0);

  if (this.status === "paid" && !this.paidAt) {
    this.paidAt = new Date();
  }

  if (this.status === "failed" && !this.failedAt) {
    this.failedAt = new Date();
  }

  if (this.status === "refunded") {
    if (this.method !== "card") {
      this.invalidate("status", "Only card payments can be refunded.");
    }

    if (!this.paidAt) {
      this.invalidate("paidAt", "A payment must be paid before it can be refunded.");
    }

    if (!this.refundedAt) {
      this.refundedAt = new Date();
    }

    if (this.refundAmount === undefined || this.refundAmount === null) {
      this.refundAmount = this.amount;
    }
  }
});

/*
 * Ensure refund information is valid.
 */
paymentSchema.pre("validate", function validateRefundAmount() {
  if (this.refundAmount === undefined || this.refundAmount === null) {
    return;
  }

  this.refundAmount = roundMoney(Number(this.refundAmount) || 0);

  if (this.refundAmount > this.amount) {
    this.invalidate("refundAmount", "Refund amount cannot exceed the original payment amount.");
  }
});

/*
 * One payment record is maintained for each booking.
 */
paymentSchema.index(
  {
    bookingId: 1,
  },
  {
    unique: true,
  }
);

/*
 * Admin payment filtering and reports.
 */
paymentSchema.index({
  status: 1,
  createdAt: -1,
});

paymentSchema.index({
  status: 1,
  paidAt: 1,
});

paymentSchema.index({
  method: 1,
  status: 1,
  createdAt: -1,
});

paymentSchema.index({
  transactionReference: 1,
});

const PaymentModel =
  (mongoose.models.Payment as Model<IPayment> | undefined) ??
  mongoose.model<IPayment>("Payment", paymentSchema);

export default PaymentModel;
