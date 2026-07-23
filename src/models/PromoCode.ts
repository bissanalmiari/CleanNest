import "server-only";

import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType,
  type Model,
} from "mongoose";

import type {
  DiscountType,
} from "@/types/enums";

const DISCOUNT_TYPES = [
  "percentage",
  "fixed_amount",
] as const satisfies readonly DiscountType[];

const promoCodeSchema = new Schema(
  {
    code: {
      type: String,
      required: [
        true,
        "Promo code is required.",
      ],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [
        3,
        "Promo code must contain at least 3 characters.",
      ],
      maxlength: [
        30,
        "Promo code cannot exceed 30 characters.",
      ],
      match: [
        /^[A-Z0-9_-]+$/,
        "Promo code can only contain letters, numbers, underscores, and hyphens.",
      ],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [
        300,
        "Promo-code description cannot exceed 300 characters.",
      ],
      default: "",
    },

    discountType: {
      type: String,
      enum: {
        values: DISCOUNT_TYPES,
        message:
          "Discount type must be percentage or fixed amount.",
      },
      required: [
        true,
        "Discount type is required.",
      ],
    },

    discountValue: {
      type: Number,
      required: [
        true,
        "Discount value is required.",
      ],
      min: [
        0.01,
        "Discount value must be greater than zero.",
      ],
    },

    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    expiryDate: {
      type: Date,
      required: [
        true,
        "Promo-code expiry date is required.",
      ],
      index: true,
    },

    minimumBookingAmount: {
      type: Number,
      min: [
        0,
        "Minimum booking amount cannot be negative.",
      ],
      default: 0,
    },

    /*
     * Mainly useful for percentage discounts.
     * Example: 20% discount with a maximum of $30.
     */
    maximumDiscountAmount: {
      type: Number,
      min: [
        0,
        "Maximum discount amount cannot be negative.",
      ],
      default: undefined,
    },

    maximumUses: {
      type: Number,
      required: [
        true,
        "Maximum uses is required.",
      ],
      min: [
        1,
        "Maximum uses must be at least one.",
      ],
    },

    usageCount: {
      type: Number,
      required: true,
      min: [
        0,
        "Usage count cannot be negative.",
      ],
      default: 0,
    },

    perCustomerLimit: {
      type: Number,
      required: true,
      min: [
        1,
        "Per-customer limit must be at least one.",
      ],
      default: 1,
    },

    /*
     * An empty array means the promo code applies
     * to every active service.
     */
    applicableServiceIds: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Service",
        },
      ],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

promoCodeSchema.pre(
  "validate",
  function validatePromoCode() {
    if (
      this.discountType ===
        "percentage" &&
      this.discountValue > 100
    ) {
      this.invalidate(
        "discountValue",
        "Percentage discount cannot exceed 100%.",
      );
    }

    if (
      this.startDate &&
      this.expiryDate &&
      this.expiryDate.getTime() <=
        this.startDate.getTime()
    ) {
      this.invalidate(
        "expiryDate",
        "Expiry date must be later than the start date.",
      );
    }

    if (
      this.usageCount >
      this.maximumUses
    ) {
      this.invalidate(
        "usageCount",
        "Usage count cannot exceed maximum uses.",
      );
    }

    if (
      this.maximumDiscountAmount !==
        undefined &&
      this.discountType ===
        "fixed_amount"
    ) {
      this.invalidate(
        "maximumDiscountAmount",
        "Maximum discount amount is only used with percentage promo codes.",
      );
    }
  },
);

promoCodeSchema.index({
  code: 1,
  isActive: 1,
});

promoCodeSchema.index({
  isActive: 1,
  startDate: 1,
  expiryDate: 1,
});

export type PromoCode =
  InferSchemaType<
    typeof promoCodeSchema
  >;

export type PromoCodeDocument =
  HydratedDocument<PromoCode>;

const PromoCodeModel =
  (models.PromoCode as
    | Model<PromoCode>
    | undefined) ??
  model<PromoCode>(
    "PromoCode",
    promoCodeSchema,
  );

export default PromoCodeModel;