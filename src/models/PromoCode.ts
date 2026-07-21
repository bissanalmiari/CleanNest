import mongoose, { Schema, Document } from "mongoose";
import type { DiscountType } from "@/types/enums";

export interface IPromoCode extends Document {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  expiryDate: Date;
  maximumUses: number;
  isActive: boolean;
}

const promoCodeSchema = new Schema<IPromoCode>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ["percentage", "fixed_amount"], required: true },
    discountValue: { type: Number, required: true },
    expiryDate: { type: Date, required: true },
    maximumUses: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.PromoCode ||
  mongoose.model<IPromoCode>("PromoCode", promoCodeSchema);
