import mongoose, { Schema, Document, Types } from "mongoose";

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

export default mongoose.models.PromoCodeUsage ||
  mongoose.model<IPromoCodeUsage>("PromoCodeUsage", promoCodeUsageSchema);
