import "server-only";

import mongoose, {
  Schema,
  type Document,
  type Model,
  type Types,
} from "mongoose";

export interface IPromoCodeUsage extends Document {
  promoCodeId: Types.ObjectId; // -> PROMO_CODES.id
  customerId: Types.ObjectId; // -> USERS.id
  bookingId: Types.ObjectId; // -> BOOKINGS.id
  discountAmount: number;
  usedAt: Date;
}

const promoCodeUsageSchema = new Schema<IPromoCodeUsage>(
  {
    promoCodeId: { type: Schema.Types.ObjectId, ref: "PromoCode", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    discountAmount: { type: Number, required: true },
    usedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// A booking may consume a promo code only once.
promoCodeUsageSchema.index({ bookingId: 1 }, { unique: true });
promoCodeUsageSchema.index({ promoCodeId: 1, customerId: 1, usedAt: -1 });
promoCodeUsageSchema.index({ promoCodeId: 1, usedAt: -1 });

const PromoCodeUsageModel =
  (mongoose.models.PromoCodeUsage as Model<IPromoCodeUsage> | undefined) ??
  mongoose.model<IPromoCodeUsage>("PromoCodeUsage", promoCodeUsageSchema);

export default PromoCodeUsageModel;
