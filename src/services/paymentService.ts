// src/services/paymentService.ts
// Payment data-access layer.
//
// CleanNest supports two payment methods:
//   - cash     -> collected after service, admin marks it received
//   - card     -> "test mode" online payment. No real card processor is
//                 called; a Payment record is created/simulated so the
//                 whole unpaid -> pending -> paid/failed -> refunded
//                 lifecycle can be exercised safely in development/demo.
//
// One Payment document exists per Booking (see the unique index on
// Payment.bookingId). The Booking document keeps a denormalized copy of
// paymentMethod/paymentStatus for fast list rendering; this service keeps
// both in sync any time a payment's status changes.

import "server-only";
import { connectDB } from "@/lib/db";
import Payment, { type IPayment } from "@/models/Payment";
import Booking from "@/models/Booking";
import { AppError, NotFoundError, ForbiddenError } from "@/lib/apiError";
import type { PaymentMethod, PaymentStatus } from "@/types/enums";

/* ------------------------------------------------------------------ */
/* Shared helpers                                                       */
/* ------------------------------------------------------------------ */

async function syncBookingPaymentStatus(
  bookingId: string,
  status: PaymentStatus
) {
  await Booking.findByIdAndUpdate(bookingId, { paymentStatus: status });
}

/** Ensures a Payment record exists for a booking, creating one from the
 * booking's trusted totalAmount/paymentMethod if it doesn't yet. */
async function getOrCreatePayment(bookingId: string) {
  await connectDB();

  const existing = await Payment.findOne({ bookingId });
  if (existing) return existing;

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new NotFoundError("Booking not found");

  const provider = booking.paymentMethod === "cash" ? "cash" : "test_card";

  const payment = await Payment.create({
    bookingId: booking._id,
    amount: booking.totalAmount,
    method: booking.paymentMethod,
    provider,
    status: booking.paymentStatus === "paid" ? "paid" : "unpaid",
  });

  return payment;
}

/* ------------------------------------------------------------------ */
/* Customer-facing operations                                          */
/* ------------------------------------------------------------------ */

export interface CustomerPaymentListFilters {
  status?: string;
  page?: number;
  limit?: number;
}

/** Lists payments that belong to bookings owned by this customer. */
export async function listPaymentsForCustomer(
  customerId: string,
  filters: CustomerPaymentListFilters = {}
) {
  await connectDB();

  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(50, Math.max(1, filters.limit ?? 10));

  const customerBookingIds = await Booking.find({ customerId }).distinct(
    "_id"
  );

  const customerMatch: Record<string, unknown> = {
    bookingId: { $in: customerBookingIds },
  };
  const match: Record<string, unknown> = { ...customerMatch };
  if (filters.status) match.status = filters.status;

  const [payments, total, summary] = await Promise.all([
    Payment.find(match)
      .populate({
        path: "bookingId",
        select: "bookingNumber bookingDate status totalAmount serviceId",
        populate: { path: "serviceId", select: "name" },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Payment.countDocuments(match),
    Payment.aggregate([
      { $match: customerMatch },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          total: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  return { payments, total, page, limit, summary };
}

/** Returns a single payment, guaranteeing it belongs to this customer. */
export async function getPaymentForCustomer(
  paymentId: string,
  customerId: string
) {
  await connectDB();

  const payment = await Payment.findById(paymentId).populate({
    path: "bookingId",
    select: "bookingNumber bookingDate status totalAmount customerId serviceId",
    populate: { path: "serviceId", select: "name" },
  });

  if (!payment) throw new NotFoundError("Payment not found");

  const booking = payment.bookingId as unknown as { customerId: { toString(): string } };
  if (!booking || booking.customerId.toString() !== customerId) {
    throw new ForbiddenError("This payment does not belong to you");
  }

  return payment;
}

/** Retrieves (creating if needed) the payment for one of the customer's
 * own bookings — used to render the "Pay now" screen. */
export async function getPaymentForBookingAsCustomer(
  bookingId: string,
  customerId: string
) {
  await connectDB();

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new NotFoundError("Booking not found");
  if (booking.customerId.toString() !== customerId) {
    throw new ForbiddenError("This booking does not belong to you");
  }

  const payment = await getOrCreatePayment(bookingId);
  return { payment, booking };
}

export interface TestCardInput {
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardholderName: string;
}

/**
 * Simulates an online card transaction in test mode. No real payment
 * processor is contacted. Uses the well-known test-card convention:
 * a card number ending in "0000" simulates a declined transaction so the
 * failure path can be demoed; every other Luhn-shaped number succeeds.
 */
export async function payBookingWithTestCard(
  bookingId: string,
  customerId: string,
  card: TestCardInput
) {
  await connectDB();

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new NotFoundError("Booking not found");
  if (booking.customerId.toString() !== customerId) {
    throw new ForbiddenError("This booking does not belong to you");
  }
  if (booking.paymentMethod !== "card") {
    throw new AppError(
      "This booking is not set up for card payment",
      400
    );
  }
  if (booking.status === "cancelled") {
    throw new AppError("Cannot pay for a cancelled booking", 400);
  }

  const payment = await getOrCreatePayment(bookingId);

  if (payment.status === "paid") {
    throw new AppError("This booking has already been paid", 409);
  }

  const digitsOnly = card.cardNumber.replace(/\s+/g, "");
  if (digitsOnly.length < 12 || digitsOnly.length > 19) {
    throw new AppError("Enter a valid test card number", 422);
  }
  if (!/^\d{2}\/\d{2}$/.test(card.expiry)) {
    throw new AppError("Expiry must be in MM/YY format", 422);
  }
  if (!/^\d{3,4}$/.test(card.cvv)) {
    throw new AppError("Enter a valid CVV", 422);
  }

  const isSimulatedDecline = digitsOnly.endsWith("0000");
  const last4 = digitsOnly.slice(-4);
  const reference = `TEST-${Date.now().toString(36).toUpperCase()}`;

  payment.status = "pending";
  await payment.save();

  if (isSimulatedDecline) {
    payment.status = "failed";
    payment.failureReason =
      "Test card declined (card number ends in 0000 — simulated decline).";
    payment.metadata = {
      cardLast4: last4,
      cardholderName: card.cardholderName,
      simulated: true,
    };
    await payment.save();
    await syncBookingPaymentStatus(bookingId, "failed");
    throw new AppError(
      "Payment declined. This is a simulated test-mode decline — try a different card number.",
      402
    );
  }

  payment.status = "paid";
  payment.transactionReference = reference;
  payment.metadata = {
    cardLast4: last4,
    cardholderName: card.cardholderName,
    simulated: true,
  };
  await payment.save();
  await syncBookingPaymentStatus(bookingId, "paid");

  return payment;
}

/* ------------------------------------------------------------------ */
/* Admin operations                                                     */
/* ------------------------------------------------------------------ */

export interface AdminPaymentListFilters {
  status?: string;
  method?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export async function getAllPayments(filters: AdminPaymentListFilters = {}) {
  await connectDB();

  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));

  const match: Record<string, unknown> = {};
  if (filters.method) match.method = filters.method;

  if (filters.dateFrom || filters.dateTo) {
    const createdAt: Record<string, Date> = {};
    if (filters.dateFrom) createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) {
      const end = new Date(filters.dateTo);
      end.setHours(23, 59, 59, 999);
      createdAt.$lte = end;
    }
    match.createdAt = createdAt;
  }

  if (filters.search) {
    const Booking_ = Booking;
    const matchingBookings = await Booking_.find({
      bookingNumber: { $regex: filters.search, $options: "i" },
    }).distinct("_id");

    match.$or = [
      { transactionReference: { $regex: filters.search, $options: "i" } },
      { bookingId: { $in: matchingBookings } },
    ];
  }

  // Keep the finance summary scoped to search, method, and date filters while
  // allowing the status tabs to continue showing every available status.
  const summaryMatch = { ...match };
  if (filters.status) match.status = filters.status;

  const [payments, total, summary] = await Promise.all([
    Payment.find(match)
      .populate({
        path: "bookingId",
        select: "bookingNumber bookingDate customerId serviceId",
        populate: [
          { path: "customerId", select: "name email" },
          { path: "serviceId", select: "name" },
        ],
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Payment.countDocuments(match),
    Payment.aggregate([
      { $match: summaryMatch },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          total: {
            $sum: {
              $cond: [
                { $eq: ["$status", "refunded"] },
                { $ifNull: ["$refundAmount", "$amount"] },
                "$amount",
              ],
            },
          },
        },
      },
    ]),
  ]);

  return { payments, total, page, limit, summary };
}

export async function getPaymentByIdForAdmin(paymentId: string) {
  await connectDB();

  const payment = await Payment.findById(paymentId).populate({
    path: "bookingId",
    select:
      "bookingNumber bookingDate status totalAmount customerId serviceId addressId",
    populate: [
      { path: "customerId", select: "name email phone" },
      { path: "serviceId", select: "name" },
      { path: "addressId", select: "city area street" },
    ],
  });

  if (!payment) throw new NotFoundError("Payment not found");
  return payment;
}

/** Admin marks a cash payment as received after the service is done. */
export async function markCashPaymentReceived(paymentId: string) {
  await connectDB();

  const payment = await Payment.findById(paymentId);
  if (!payment) throw new NotFoundError("Payment not found");
  if (payment.method !== "cash") {
    throw new AppError("Only cash payments can be marked received this way", 400);
  }
  if (payment.status === "paid") {
    throw new AppError("This payment is already marked as paid", 409);
  }

  payment.status = "paid";
  await payment.save();
  await syncBookingPaymentStatus(payment.bookingId.toString(), "paid");

  return payment;
}

/** Admin manually marks a payment as failed (e.g. cash no-show, or a
 * stuck test-card attempt). */
export async function markPaymentFailed(paymentId: string, reason?: string) {
  await connectDB();

  const payment = await Payment.findById(paymentId);
  if (!payment) throw new NotFoundError("Payment not found");
  if (payment.status === "paid") {
    throw new AppError(
      "A paid payment cannot be marked failed — refund it instead",
      400
    );
  }

  payment.status = "failed";
  payment.failureReason = reason?.trim() || "Marked as failed by admin.";
  await payment.save();
  await syncBookingPaymentStatus(payment.bookingId.toString(), "failed");

  return payment;
}

/** Admin issues a refund for a paid card payment. */
export async function refundPayment(
  paymentId: string,
  amount: number | undefined,
  reason: string | undefined
) {
  await connectDB();

  const payment = await Payment.findById(paymentId);
  if (!payment) throw new NotFoundError("Payment not found");
  if (payment.method !== "card") {
    throw new AppError("Only card payments can be refunded", 400);
  }
  if (payment.status !== "paid") {
    throw new AppError("Only a paid payment can be refunded", 400);
  }

  payment.status = "refunded";
  payment.refundAmount = amount ?? payment.amount;
  payment.refundReason = reason?.trim() || undefined;
  payment.refundReference = `RF-${Date.now().toString(36).toUpperCase()}`;
  await payment.save();
  await syncBookingPaymentStatus(payment.bookingId.toString(), "refunded");

  return payment;
}

export type { IPayment, PaymentMethod, PaymentStatus };
