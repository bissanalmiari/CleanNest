import type { DiscountType } from "./enums";

export interface PromoCode {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  expiryDate: string;
  maximumUses: number;
  isActive: boolean;
}

export interface PromoCodeUsage {
  id: string;
  promoCodeId: string;
  customerId: string;
  bookingId: string;
  discountAmount: number;
  usedAt: string;
}
