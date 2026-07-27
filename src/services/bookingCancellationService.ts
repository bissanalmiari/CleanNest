import "server-only";

import { randomUUID } from "node:crypto";

import mongoose, { Types, type ClientSession } from "mongoose";

import { AppError } from "@/lib/apiError";
import { connectDB } from "@/lib/db";

import BookingModel from "@/models/Booking";
import BookingStatusHistoryModel from "@/models/BookingStatusHistory";
import PaymentModel from "@/models/Payment";
import PromoCodeModel from "@/models/PromoCode";
import CleanerAssignment from "@/models/CleanerAssignment";
import {
  createNotification,
  createNotifications,
  notifyActiveAdmins,
} from "@/services/notificationService";

import { checkBookingChangeWindow, type CancelBookingInput } from "@/validators/bookingValidator";

interface CancelCustomerBookingOptions {
  customerId: string;
  bookingId: string;
  input: CancelBookingInput;
  now?: Date;
}

type CancellationPaymentAction =
  | "no_payment_required"
  | "cash_payment_cancelled"
  | "card_payment_cancelled"
  | "card_payment_refunded"
  | "payment_already_failed"
  | "payment_already_refunded";

interface CancellationPaymentResult {
  action: CancellationPaymentAction;
  method: string;
  previousStatus: string;
  newStatus: string;
  refundAmount: number;
  refundReference: string | null;
}

interface CancelledBookingResult {
  booking: {
    id: string;
    bookingNumber: string;

    previousStatus: string;
    status: "cancelled";

    cancellationReason: string;
    cancelledAt: string;

    bookingDate: string;
    startTime: string;
    endTime: string;

    payment: CancellationPaymentResult;

    promoCodeUsageRestored: boolean;

    assignedCleanerName: string | null;
    updatedAt: string;
  };
}

interface HandleCancellationPaymentOptions {
  bookingId: Types.ObjectId;
  bookingNumber: string;
  paymentMethod: string;
  bookingPaymentStatus: string;
  totalAmount: number;
  cancellationReason: string;
  now: Date;
  session: ClientSession;
}

function validateObjectId(value: string, fieldName: string) {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(`${fieldName} is invalid.`, 422);
  }

  return new Types.ObjectId(value);
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatDateInBeirut(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Beirut",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;

  const month = parts.find((part) => part.type === "month")?.value;

  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new AppError("Unable to determine the booking date.", 500);
  }

  return `${year}-${month}-${day}`;
}

function createRefundReference(bookingNumber: string) {
  const randomPart = randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();

  return `RF-${bookingNumber}-${randomPart}`;
}

/*
 * Decreases the promo-code usage count when a booking
 * that used the promo code is cancelled.
 *
 * The booking keeps promoCodeId so its historical price
 * information remains available.
 */
async function restorePromoCodeUsage({
  promoCodeId,
  session,
}: {
  promoCodeId?: Types.ObjectId;
  session: ClientSession;
}) {
  if (!promoCodeId) {
    return false;
  }

  const updateResult = await PromoCodeModel.updateOne(
    {
      _id: promoCodeId,

      $expr: {
        $gt: [
          {
            $ifNull: ["$usageCount", 0],
          },
          0,
        ],
      },
    },
    {
      $inc: {
        usageCount: -1,
      },
    },
    {
      session,
    }
  );

  return updateResult.modifiedCount === 1;
}

/*
 * Updates or creates the payment record according to
 * the payment state at cancellation time.
 */
async function handleCancellationPayment({
  bookingId,
  bookingNumber,
  paymentMethod,
  bookingPaymentStatus,
  totalAmount,
  cancellationReason,
  now,
  session,
}: HandleCancellationPaymentOptions): Promise<CancellationPaymentResult> {
  const payment = await PaymentModel.findOne({
    bookingId,
  })
    .session(session)
    .exec();

  /*
   * Cash is collected after the cleaning service.
   * A paid cash booking must be reviewed by an admin
   * because the current payment model only supports
   * automatic refunds for card payments.
   */
  if (paymentMethod === "cash") {
    const currentStatus = payment?.status ?? bookingPaymentStatus;

    if (currentStatus === "paid" || currentStatus === "refunded") {
      throw new AppError(
        "This cash booking has already been paid. Please contact CleanNest support to cancel it.",
        409
      );
    }

    if (payment && payment.status === "pending") {
      payment.status = "failed";

      payment.failureReason = "Booking cancelled before cash collection.";

      payment.failedAt = now;

      payment.metadata = {
        ...(payment.metadata ?? {}),
        cancellationReason,
        cancelledAt: now.toISOString(),
      };

      await payment.save({
        session,
      });

      return {
        action: "cash_payment_cancelled",

        method: "cash",

        previousStatus: "pending",

        newStatus: "failed",

        refundAmount: 0,

        refundReference: null,
      };
    }

    return {
      action: "no_payment_required",

      method: "cash",

      previousStatus: currentStatus,

      newStatus: currentStatus === "failed" ? "failed" : "unpaid",

      refundAmount: 0,

      refundReference: null,
    };
  }

  /*
   * A card booking marked paid or refunded must have a
   * payment record. Otherwise, the financial information
   * is inconsistent and should not be silently changed.
   */
  if (!payment && (bookingPaymentStatus === "paid" || bookingPaymentStatus === "refunded")) {
    throw new AppError(
      "The payment record for this booking could not be found. Please contact CleanNest support.",
      409
    );
  }

  /*
   * No card payment record exists yet. Create a failed
   * record to preserve the cancellation audit trail.
   */
  if (!payment) {
    const paymentDocuments = await PaymentModel.create(
      [
        {
          bookingId,

          amount: roundMoney(totalAmount),

          currency: "USD",

          method: "card",

          provider: "test_card",

          status: "failed",

          failureReason: "Booking cancelled before card payment completion.",

          failedAt: now,

          metadata: {
            cancellationReason,
            cancelledAt: now.toISOString(),
          },
        },
      ],
      {
        session,
      }
    );

    const createdPayment = paymentDocuments.at(0);

    if (!createdPayment) {
      throw new AppError("The cancelled payment record could not be created.", 500);
    }

    return {
      action: "card_payment_cancelled",

      method: "card",

      previousStatus: bookingPaymentStatus,

      newStatus: "failed",

      refundAmount: 0,

      refundReference: null,
    };
  }

  const previousPaymentStatus = payment.status;

  if (payment.status === "refunded") {
    return {
      action: "payment_already_refunded",

      method: "card",

      previousStatus: previousPaymentStatus,

      newStatus: "refunded",

      refundAmount: roundMoney(payment.refundAmount ?? payment.amount),

      refundReference: payment.refundReference ?? null,
    };
  }

  if (payment.status === "failed") {
    return {
      action: "payment_already_failed",

      method: "card",

      previousStatus: previousPaymentStatus,

      newStatus: "failed",

      refundAmount: 0,

      refundReference: null,
    };
  }

  /*
   * A successfully paid test-card booking receives a
   * full automatic refund.
   */
  if (payment.status === "paid") {
    const refundAmount = roundMoney(payment.amount);

    const refundReference = createRefundReference(bookingNumber);

    payment.status = "refunded";

    payment.refundAmount = refundAmount;

    payment.refundReason = `Booking cancelled by customer: ${cancellationReason}`;

    payment.refundReference = refundReference;

    payment.refundedAt = now;

    payment.metadata = {
      ...(payment.metadata ?? {}),
      cancellationReason,
      cancelledAt: now.toISOString(),
      refundType: "full",
    };

    await payment.save({
      session,
    });

    return {
      action: "card_payment_refunded",

      method: "card",

      previousStatus: previousPaymentStatus,

      newStatus: "refunded",

      refundAmount,

      refundReference,
    };
  }

  /*
   * Pending or unpaid card payments are stopped because
   * the booking will no longer be fulfilled.
   */
  payment.status = "failed";

  payment.failureReason = "Booking cancelled before card payment completion.";

  payment.failedAt = now;

  payment.metadata = {
    ...(payment.metadata ?? {}),
    cancellationReason,
    cancelledAt: now.toISOString(),
  };

  await payment.save({
    session,
  });

  return {
    action: "card_payment_cancelled",

    method: "card",

    previousStatus: previousPaymentStatus,

    newStatus: "failed",

    refundAmount: 0,

    refundReference: null,
  };
}

/*
 * Cancels a customer-owned booking.
 *
 * Rules:
 * - Booking must belong to the logged-in customer.
 * - Booking must be pending or confirmed.
 * - Cancellation must happen at least 24 hours before
 *   the scheduled start.
 * - Promo usage is restored.
 * - Paid card bookings receive a full test refund.
 * - A status-history record is created.
 */
export async function cancelCustomerBooking({
  customerId,
  bookingId,
  input,
  now = new Date(),
}: CancelCustomerBookingOptions): Promise<CancelledBookingResult> {
  await connectDB();

  const customerObjectId = validateObjectId(customerId, "Customer ID");

  const bookingObjectId = validateObjectId(bookingId, "Booking ID");

  const cancellationReason = input.reason.trim();

  const session = await mongoose.startSession();

  try {
    const transactionResult = await session.withTransaction(async () => {
      /*
       * Read the booking inside the transaction so a
       * simultaneous update or cancellation is not
       * ignored.
       */
      const booking = await BookingModel.findOne({
        _id: bookingObjectId,
        customerId: customerObjectId,
      })
        .session(session)
        .exec();

      if (!booking) {
        throw new AppError("The booking could not be found.", 404);
      }

      const previousStatus = booking.status;

      const changeWindow = checkBookingChangeWindow({
        bookingDate: booking.bookingDate,

        startTime: booking.startTime,

        status: booking.status,

        now,
      });

      if (!changeWindow.allowed) {
        throw new AppError(changeWindow.reason ?? "This booking can no longer be cancelled.", 409);
      }

      const paymentResult = await handleCancellationPayment({
        bookingId: bookingObjectId,

        bookingNumber: booking.bookingNumber,

        paymentMethod: booking.paymentMethod,

        bookingPaymentStatus: booking.paymentStatus,

        totalAmount: booking.totalAmount,

        cancellationReason,

        now,

        session,
      });

      /*
       * Synchronize the booking payment status with
       * the payment result.
       */
      if (paymentResult.newStatus === "refunded") {
        booking.paymentStatus = "refunded";
      } else if (paymentResult.newStatus === "failed") {
        booking.paymentStatus = "failed";
      } else if (paymentResult.newStatus === "unpaid") {
        booking.paymentStatus = "unpaid";
      }

      booking.status = "cancelled";

      booking.cancellationReason = cancellationReason;

      booking.cancelledAt = now;

      booking.cancelledByUserId = customerObjectId;

      await booking.save({
        session,
      });

      const promoCodeUsageRestored = await restorePromoCodeUsage({
        promoCodeId: booking.promoCodeId,

        session,
      });

      await BookingStatusHistoryModel.create(
        [
          {
            bookingId: bookingObjectId,

            previousStatus,

            newStatus: "cancelled",

            changedByUserId: customerObjectId,

            reason: "Booking cancelled by customer.",

            metadata: {
              source: "customer",

              cancellationReason,

              cancelledAt: now.toISOString(),

              hoursBeforeBooking: changeWindow.hoursUntilBooking,

              paymentAction: paymentResult.action,

              paymentPreviousStatus: paymentResult.previousStatus,

              paymentNewStatus: paymentResult.newStatus,

              refundAmount: paymentResult.refundAmount,

              refundReference: paymentResult.refundReference,

              promoCodeUsageRestored,
            },
          },
        ],
        {
          session,
        }
      );

      return {
        booking,
        previousStatus,
        paymentResult,
        promoCodeUsageRestored,
      };
    });

    if (!transactionResult) {
      throw new AppError("The cancellation transaction did not return a booking.", 500);
    }

    const { booking, previousStatus, paymentResult, promoCodeUsageRestored } = transactionResult;

    const assignedCleaners = await CleanerAssignment.find({
      bookingId: booking._id,
      status: { $in: ["assigned", "accepted"] },
    })
      .select("cleanerId")
      .lean();
    await Promise.all([
      createNotification({
        userId: customerId,
        type: "booking_cancelled",
        title: "Booking cancelled",
        message: `Booking ${booking.bookingNumber} was cancelled successfully.`,
        href: "/bookings",
        bookingId,
        dedupeKey: `booking-cancelled:${bookingId}`,
        email: true,
      }),
      createNotifications(
        assignedCleaners.map((assignment) => ({
          userId: assignment.cleanerId.toString(),
          type: "booking_cancelled" as const,
          title: "Assigned job cancelled",
          message: `Booking ${booking.bookingNumber} has been cancelled and removed from your route.`,
          href: "/cleaner/upcoming",
          bookingId,
          dedupeKey: `booking-cancelled:${bookingId}:${assignment.cleanerId.toString()}`,
          email: true,
        }))
      ),
      notifyActiveAdmins({
        type: "booking_cancelled",
        title: "Customer cancelled a booking",
        message: `Booking ${booking.bookingNumber} was cancelled by the customer.`,
        href: `/admin/bookings/${bookingId}`,
        bookingId,
        dedupeKey: `customer-cancelled:${bookingId}`,
        email: false,
      }),
    ]).catch((error) => console.error("[notification:cancellation]", error));

    return {
      booking: {
        id: booking._id.toString(),

        bookingNumber: booking.bookingNumber,

        previousStatus,

        status: "cancelled",

        cancellationReason,

        cancelledAt: (booking.cancelledAt ?? now).toISOString(),

        bookingDate: formatDateInBeirut(booking.bookingDate),

        startTime: booking.startTime,

        endTime: booking.endTime,

        payment: paymentResult,

        promoCodeUsageRestored,

        assignedCleanerName: booking.assignedCleanerName ?? null,

        updatedAt: booking.updatedAt.toISOString(),
      },
    };
  } finally {
    await session.endSession();
  }
}
