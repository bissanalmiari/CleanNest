// src/services/promoCodeManagementService.ts
// Admin promo-code data-access layer: list, detail (with usage history),
// create, update, delete. Usage counts are derived from PromoCodeUsage —
// this service never writes to that collection, only reads it.

import "server-only";
import { connectDB } from "@/lib/db";
import PromoCode from "@/models/PromoCode";
import PromoCodeUsage from "@/models/PromoCodeUsage";
import { AppError, NotFoundError } from "@/lib/apiError";
import type { DiscountType } from "@/types/enums";

const VALID_DISCOUNT_TYPES: DiscountType[] = ["percentage", "fixed_amount"];

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function validateDiscount(discountType: DiscountType, discountValue: number) {
  if (!VALID_DISCOUNT_TYPES.includes(discountType)) {
    throw new AppError(
      'discountType must be "percentage" or "fixed_amount"',
      422
    );
  }

  if (discountType === "percentage") {
    if (!(discountValue >= 1 && discountValue <= 100)) {
      throw new AppError(
        "Percentage discount value must be between 1 and 100",
        422
      );
    }
  } else if (!(discountValue > 0)) {
    throw new AppError("Fixed discount value must be greater than 0", 422);
  }
}

function validateExpiryDate(expiryDate: Date) {
  if (Number.isNaN(expiryDate.getTime())) {
    throw new AppError("expiryDate is not a valid date", 422);
  }
  if (expiryDate.getTime() <= Date.now()) {
    throw new AppError("expiryDate must be in the future", 422);
  }
}

async function assertCodeAvailable(code: string, excludeId?: string) {
  const existing = await PromoCode.findOne({
    code,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).lean();

  if (existing) {
    throw new AppError(`Promo code "${code}" already exists`, 409);
  }
}

/* ------------------------------------------------------------------ */
/* 1) List promo codes (with derived usage stats)                       */
/* ------------------------------------------------------------------ */

export interface PromoCodeListFilters {
  search?: string; // matches code
  isActive?: boolean;
}

export async function getAllPromoCodes(filters: PromoCodeListFilters = {}) {
  await connectDB();

  const { search, isActive } = filters;
  const match: Record<string, unknown> = {};

  if (typeof isActive === "boolean") match.isActive = isActive;
  if (search) {
    match.code = { $regex: search.toUpperCase().trim(), $options: "i" };
  }

  const codes = await PromoCode.find(match).sort({ createdAt: -1 }).lean();

  const usageCounts = await Promise.all(
    codes.map((c: { _id: unknown }) =>
      PromoCodeUsage.countDocuments({ promoCodeId: c._id })
    )
  );

  const now = Date.now();

  return codes.map(
    (
      code: {
        _id: unknown;
        maximumUses: number;
        expiryDate: Date;
        [key: string]: unknown;
      },
      i: number
    ) => {
      const usedCount = usageCounts[i];
      return {
        ...code,
        usedCount,
        usesRemaining: Math.max(0, code.maximumUses - usedCount),
        isExpired: new Date(code.expiryDate).getTime() < now,
      };
    }
  );
}

/* ------------------------------------------------------------------ */
/* 2) Promo code detail (with recent usage history)                     */
/* ------------------------------------------------------------------ */

export async function getPromoCodeById(id: string) {
  await connectDB();

  const code = await PromoCode.findById(id).lean();
  if (!code) {
    throw new NotFoundError("Promo code not found");
  }

  const [usedCount, recentUsage] = await Promise.all([
    PromoCodeUsage.countDocuments({ promoCodeId: id }),
    PromoCodeUsage.find({ promoCodeId: id })
      .sort({ usedAt: -1 })
      .limit(10)
      .populate("customerId", "name email")
      .populate("bookingId", "bookingNumber")
      .lean(),
  ]);

  return {
    ...code,
    usedCount,
    usesRemaining: Math.max(0, code.maximumUses - usedCount),
    isExpired: new Date(code.expiryDate).getTime() < Date.now(),
    recentUsage,
  };
}

/* ------------------------------------------------------------------ */
/* 3) Create                                                            */
/* ------------------------------------------------------------------ */

export interface CreatePromoCodeInput {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  expiryDate: string; // ISO date string from the client
  maximumUses: number;
  isActive?: boolean;
}

export async function createPromoCode(input: CreatePromoCodeInput) {
  await connectDB();

  const code = input.code?.trim().toUpperCase();
  if (!code) {
    throw new AppError("code is required", 422);
  }

  validateDiscount(input.discountType, input.discountValue);

  const expiryDate = new Date(input.expiryDate);
  validateExpiryDate(expiryDate);

  if (!Number.isInteger(input.maximumUses) || input.maximumUses <= 0) {
    throw new AppError("maximumUses must be a positive whole number", 422);
  }

  await assertCodeAvailable(code);

  const promoCode = await PromoCode.create({
    code,
    discountType: input.discountType,
    discountValue: input.discountValue,
    expiryDate,
    maximumUses: input.maximumUses,
    isActive: input.isActive ?? true,
  });

  return promoCode.toObject();
}

/* ------------------------------------------------------------------ */
/* 4) Update                                                            */
/* ------------------------------------------------------------------ */

export interface UpdatePromoCodeInput {
  code?: string;
  discountType?: DiscountType;
  discountValue?: number;
  expiryDate?: string;
  maximumUses?: number;
  isActive?: boolean;
}

export async function updatePromoCode(
  id: string,
  input: UpdatePromoCodeInput
) {
  await connectDB();

  const promoCode = await PromoCode.findById(id);
  if (!promoCode) {
    throw new NotFoundError("Promo code not found");
  }

  // Validate discount fields together if either is being changed, since
  // the valid range for discountValue depends on discountType.
  if (input.discountType !== undefined || input.discountValue !== undefined) {
    const nextType = input.discountType ?? promoCode.discountType;
    const nextValue = input.discountValue ?? promoCode.discountValue;
    validateDiscount(nextType, nextValue);
  }

  if (input.expiryDate !== undefined) {
    const nextExpiry = new Date(input.expiryDate);
    validateExpiryDate(nextExpiry);
    promoCode.expiryDate = nextExpiry;
  }

  if (input.maximumUses !== undefined) {
    if (!Number.isInteger(input.maximumUses) || input.maximumUses <= 0) {
      throw new AppError("maximumUses must be a positive whole number", 422);
    }
    promoCode.maximumUses = input.maximumUses;
  }

  if (input.code !== undefined) {
    const nextCode = input.code.trim().toUpperCase();
    if (!nextCode) {
      throw new AppError("code cannot be empty", 422);
    }
    await assertCodeAvailable(nextCode, id);
    promoCode.code = nextCode;
  }

  if (input.discountType !== undefined) promoCode.discountType = input.discountType;
  if (input.discountValue !== undefined) promoCode.discountValue = input.discountValue;
  if (input.isActive !== undefined) promoCode.isActive = input.isActive;

  await promoCode.save();
  return promoCode.toObject();
}

/* ------------------------------------------------------------------ */
/* 5) Delete                                                            */
/* ------------------------------------------------------------------ */

export async function deletePromoCode(id: string) {
  await connectDB();

  const promoCode = await PromoCode.findById(id);
  if (!promoCode) {
    throw new NotFoundError("Promo code not found");
  }

  // NOTE: this is a hard delete. Existing PromoCodeUsage records that
  // reference this promoCodeId are intentionally left untouched — they
  // document a discount that was actually applied to a real booking, so
  // deleting them would corrupt historical order/revenue data. In practice,
  // setting isActive to false is the safer choice for a code that already
  // has usage history; hard delete is implemented here because it was
  // explicitly requested.
  await promoCode.deleteOne();

  return { deletedId: id };
}
