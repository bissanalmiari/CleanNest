import mongoose, { Schema, Document, Types } from "mongoose";
import type { PaymentMethod, PaymentStatus } from "@/types/enums";

export interface IPayment extends Document {
  bookingId: Types.ObjectId; // -> BOOKINGS.id
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionReference?: string;
  paidAt?: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ["cash", "card", "wallet", "bank_transfer"], required: true },
    status: {
      type: String,
      enum: ["unpaid", "pending", "paid", "refunded", "failed"],
      default: "pending",
    },
    transactionReference: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model<IPayment>("Payment", paymentSchema);
