import "server-only";

import { Types } from "mongoose";

import { AppError, NotFoundError } from "@/lib/apiError";
import { connectDB } from "@/lib/db";
import PromoCode from "@/models/PromoCode";
import PromoCodeUsage from "@/models/PromoCodeUsage";
import Service from "@/models/Service";
import Booking from "@/models/Booking";
import type { DiscountType } from "@/types/enums";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateDiscount(type: DiscountType, value: number) {
  if (type === "percentage" && (value <= 0 || value > 100)) {
    throw new AppError("Percentage discount must be between 0.01 and 100", 422);
  }
  if (type === "fixed_amount" && value <= 0) {
    throw new AppError("Fixed discount must be greater than zero", 422);
  }
}

function parseDate(value: string, label: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${label} is not a valid date`, 422);
  }
  return date;
}

async function assertCodeAvailable(code: string, excludeId?: string) {
  const existing = await PromoCode.exists({
    code,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });
  if (existing) {
    throw new AppError(`Promo code "${code}" already exists`, 409);
  }
}

async function validateApplicableServices(ids: string[] = []) {
  const uniqueIds = [...new Set(ids)].map((id) => new Types.ObjectId(id));
  if (uniqueIds.length === 0) return uniqueIds;

  const count = await Service.countDocuments({ _id: { $in: uniqueIds } });
  if (count !== uniqueIds.length) {
    throw new AppError("One or more selected services do not exist", 422);
  }
  return uniqueIds;
}

export interface PromoCodeListFilters {
  search?: string;
  isActive?: boolean;
}

export async function getAllPromoCodes(filters: PromoCodeListFilters = {}) {
  await connectDB();

  const match: Record<string, unknown> = {};
  if (typeof filters.isActive === "boolean") match.isActive = filters.isActive;
  if (filters.search?.trim()) {
    match.code = {
      $regex: escapeRegex(filters.search.trim().toUpperCase()),
      $options: "i",
    };
  }

  const codes = await PromoCode.find(match)
    .sort({ createdAt: -1 })
    .populate("applicableServiceIds", "name")
    .lean()
    .exec();
  const now = Date.now();

  return codes.map((code) => {
    const usedCount = code.usageCount ?? 0;
    return {
      ...code,
      usedCount,
      usesRemaining: Math.max(0, code.maximumUses - usedCount),
      isExpired: new Date(code.expiryDate).getTime() < now,
      isScheduled: new Date(code.startDate).getTime() > now,
    };
  });
}

export async function getPromoCodeById(id: string) {
  await connectDB();

  const code = await PromoCode.findById(id)
    .populate("applicableServiceIds", "name")
    .lean()
    .exec();
  if (!code) throw new NotFoundError("Promo code not found");

  const trackedUsage = await PromoCodeUsage.find({ promoCodeId: id })
    .sort({ usedAt: -1 })
    .limit(20)
    .populate("customerId", "name email")
    .populate("bookingId", "bookingNumber")
    .lean()
    .exec();
  let recentUsage =
    trackedUsage as unknown as Array<Record<string, unknown>>;
  const usedCount = code.usageCount ?? 0;

  // Older bookings predate PromoCodeUsage tracking. Keep their redemption
  // history visible to administrators after upgrading this feature.
  if (recentUsage.length === 0 && usedCount > 0) {
    const historicalBookings = await Booking.find({ promoCodeId: id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("_id bookingNumber customerId discountAmount createdAt")
      .populate("customerId", "name email")
      .lean()
      .exec();

    recentUsage = historicalBookings.map((booking) => ({
      _id: booking._id,
      promoCodeId: code._id,
      customerId: booking.customerId,
      bookingId: {
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
      },
      discountAmount: booking.discountAmount,
      usedAt: booking.createdAt,
    }));
  }

  return {
    ...code,
    usedCount,
    usesRemaining: Math.max(0, code.maximumUses - usedCount),
    isExpired: new Date(code.expiryDate).getTime() < Date.now(),
    isScheduled: new Date(code.startDate).getTime() > Date.now(),
    recentUsage,
  };
}

export interface CreatePromoCodeInput {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  startDate?: string;
  expiryDate: string;
  minimumBookingAmount?: number;
  maximumDiscountAmount?: number | null;
  maximumUses: number;
  perCustomerLimit?: number;
  applicableServiceIds?: string[];
  isActive?: boolean;
}

export async function createPromoCode(input: CreatePromoCodeInput) {
  await connectDB();

  const code = input.code.trim().toUpperCase();
  validateDiscount(input.discountType, input.discountValue);
  await assertCodeAvailable(code);

  const startDate = input.startDate
    ? parseDate(input.startDate, "startDate")
    : new Date();
  const expiryDate = parseDate(input.expiryDate, "expiryDate");
  if (expiryDate <= startDate) {
    throw new AppError("expiryDate must be later than startDate", 422);
  }
  if (expiryDate <= new Date()) {
    throw new AppError("expiryDate must be in the future", 422);
  }
  if (!Number.isInteger(input.maximumUses) || input.maximumUses < 1) {
    throw new AppError("maximumUses must be a positive whole number", 422);
  }

  const perCustomerLimit = input.perCustomerLimit ?? 1;
  if (!Number.isInteger(perCustomerLimit) || perCustomerLimit < 1) {
    throw new AppError("perCustomerLimit must be a positive whole number", 422);
  }
  if ((input.minimumBookingAmount ?? 0) < 0) {
    throw new AppError("minimumBookingAmount cannot be negative", 422);
  }
  if (
    input.discountType === "fixed_amount" &&
    input.maximumDiscountAmount != null
  ) {
    throw new AppError(
      "maximumDiscountAmount is only available for percentage codes",
      422,
    );
  }

  const applicableServiceIds = await validateApplicableServices(
    input.applicableServiceIds,
  );
  const promoCode = await PromoCode.create({
    code,
    description: input.description?.trim() ?? "",
    discountType: input.discountType,
    discountValue: input.discountValue,
    startDate,
    expiryDate,
    minimumBookingAmount: input.minimumBookingAmount ?? 0,
    maximumDiscountAmount: input.maximumDiscountAmount ?? undefined,
    maximumUses: input.maximumUses,
    perCustomerLimit,
    applicableServiceIds,
    isActive: input.isActive ?? true,
  });

  return promoCode.toObject();
}

export type UpdatePromoCodeInput = Partial<CreatePromoCodeInput>;

export async function updatePromoCode(id: string, input: UpdatePromoCodeInput) {
  await connectDB();

  const promoCode = await PromoCode.findById(id);
  if (!promoCode) throw new NotFoundError("Promo code not found");

  const nextType = input.discountType ?? promoCode.discountType;
  const nextValue = input.discountValue ?? promoCode.discountValue;
  validateDiscount(nextType, nextValue);

  if (input.code !== undefined) {
    const code = input.code.trim().toUpperCase();
    await assertCodeAvailable(code, id);
    promoCode.code = code;
  }
  if (input.description !== undefined) {
    promoCode.description = input.description.trim();
  }
  if (input.discountType !== undefined) promoCode.discountType = input.discountType;
  if (input.discountValue !== undefined) promoCode.discountValue = input.discountValue;
  if (input.startDate !== undefined) {
    promoCode.startDate = parseDate(input.startDate, "startDate");
  }
  if (input.expiryDate !== undefined) {
    promoCode.expiryDate = parseDate(input.expiryDate, "expiryDate");
  }
  if (new Date(promoCode.expiryDate) <= new Date(promoCode.startDate)) {
    throw new AppError("expiryDate must be later than startDate", 422);
  }
  if (input.minimumBookingAmount !== undefined) {
    if (input.minimumBookingAmount < 0) {
      throw new AppError("minimumBookingAmount cannot be negative", 422);
    }
    promoCode.minimumBookingAmount = input.minimumBookingAmount;
  }
  if (input.maximumDiscountAmount !== undefined) {
    promoCode.maximumDiscountAmount =
      input.maximumDiscountAmount ?? undefined;
  }
  if (nextType === "fixed_amount") {
    promoCode.maximumDiscountAmount = undefined;
  }
  if (input.maximumUses !== undefined) {
    if (
      !Number.isInteger(input.maximumUses) ||
      input.maximumUses < Math.max(1, promoCode.usageCount ?? 0)
    ) {
      throw new AppError(
        "maximumUses cannot be lower than the number already used",
        422,
      );
    }
    promoCode.maximumUses = input.maximumUses;
  }
  if (input.perCustomerLimit !== undefined) {
    if (!Number.isInteger(input.perCustomerLimit) || input.perCustomerLimit < 1) {
      throw new AppError("perCustomerLimit must be a positive whole number", 422);
    }
    promoCode.perCustomerLimit = input.perCustomerLimit;
  }
  if (input.applicableServiceIds !== undefined) {
    promoCode.applicableServiceIds = await validateApplicableServices(
      input.applicableServiceIds,
    );
  }
  if (input.isActive !== undefined) promoCode.isActive = input.isActive;

  await promoCode.save();
  return promoCode.toObject();
}

export async function deletePromoCode(id: string) {
  await connectDB();

  const promoCode = await PromoCode.findById(id);
  if (!promoCode) throw new NotFoundError("Promo code not found");

  if ((promoCode.usageCount ?? 0) > 0) {
    promoCode.isActive = false;
    await promoCode.save();
    return { deletedId: null, archivedId: id };
  }

  await promoCode.deleteOne();
  return { deletedId: id, archivedId: null };
}
