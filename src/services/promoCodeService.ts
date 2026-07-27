import "server-only";

import { Types } from "mongoose";

import { AppError, NotFoundError } from "@/lib/apiError";
import { connectDB } from "@/lib/db";
import PromoCode from "@/models/PromoCode";
import PromoCodeUsage from "@/models/PromoCodeUsage";
import Booking from "@/models/Booking";
import type { ValidatePromoCodeValues } from "@/validators/promoCodeValidator";

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function validatePromoCodeForCustomer({
  customerId,
  input,
  now = new Date(),
}: {
  customerId: string;
  input: ValidatePromoCodeValues;
  now?: Date;
}) {
  await connectDB();

  const code = input.code.trim().toUpperCase();
  const promoCode = await PromoCode.findOne({ code }).lean().exec();

  if (!promoCode) {
    throw new NotFoundError("This promo code does not exist.");
  }

  if (!promoCode.isActive) {
    throw new AppError("This promo code is currently inactive.", 409);
  }

  if (now < new Date(promoCode.startDate)) {
    throw new AppError("This promo code is not available yet.", 409);
  }

  if (now > new Date(promoCode.expiryDate)) {
    throw new AppError("This promo code has expired.", 409);
  }

  if ((promoCode.usageCount ?? 0) >= promoCode.maximumUses) {
    throw new AppError("This promo code has reached its usage limit.", 409);
  }

  const serviceIds = promoCode.applicableServiceIds ?? [];
  if (
    input.serviceId &&
    serviceIds.length > 0 &&
    !serviceIds.some((id) => id.toString() === input.serviceId)
  ) {
    throw new AppError("This promo code does not apply to the selected cleaning service.", 409);
  }

  const customerObjectId = new Types.ObjectId(customerId);
  const [trackedUses, historicalBookingUses] = await Promise.all([
    PromoCodeUsage.countDocuments({
      promoCodeId: promoCode._id,
      customerId: customerObjectId,
    }),
    Booking.countDocuments({
      promoCodeId: promoCode._id,
      customerId: customerObjectId,
    }),
  ]);
  const customerUses = Math.max(trackedUses, historicalBookingUses);

  if (customerUses >= promoCode.perCustomerLimit) {
    throw new AppError("You have already used this promo code the maximum number of times.", 409);
  }

  const bookingAmount = input.bookingAmount;
  const minimumBookingAmount = promoCode.minimumBookingAmount ?? 0;

  if (bookingAmount !== undefined && bookingAmount < minimumBookingAmount) {
    throw new AppError(
      `This code requires a minimum booking subtotal of $${money(minimumBookingAmount).toFixed(
        2
      )}.`,
      409
    );
  }

  let estimatedDiscount: number | null = null;
  if (bookingAmount !== undefined) {
    estimatedDiscount =
      promoCode.discountType === "percentage"
        ? bookingAmount * (promoCode.discountValue / 100)
        : promoCode.discountValue;

    if (promoCode.discountType === "percentage" && promoCode.maximumDiscountAmount != null) {
      estimatedDiscount = Math.min(estimatedDiscount, promoCode.maximumDiscountAmount);
    }

    estimatedDiscount = money(Math.min(Math.max(estimatedDiscount, 0), bookingAmount));
  }

  return {
    id: promoCode._id.toString(),
    code: promoCode.code,
    description: promoCode.description ?? "",
    discountType: promoCode.discountType,
    discountValue: promoCode.discountValue,
    estimatedDiscount,
    minimumBookingAmount,
    maximumDiscountAmount: promoCode.maximumDiscountAmount ?? null,
    expiryDate: new Date(promoCode.expiryDate).toISOString(),
    usesRemaining: Math.max(0, promoCode.maximumUses - (promoCode.usageCount ?? 0)),
  };
}
