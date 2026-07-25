import type { DiscountType } from "./enums";

export interface PromoCode {
  id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  startDate: string;
  expiryDate: string;
  minimumBookingAmount: number;
  maximumDiscountAmount: number | null;
  maximumUses: number;
  usageCount: number;
  perCustomerLimit: number;
  applicableServiceIds: string[];
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
