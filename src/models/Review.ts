import mongoose, { Schema, Document, Types } from "mongoose";

export interface IReview extends Document {
  bookingId: Types.ObjectId; // -> BOOKINGS.id (unique: one review per booking)
  customerId: Types.ObjectId; // -> USERS.id
  rating: number;
  comment?: string;
  adminReply?: string;
  isVisible: boolean;
}

const reviewSchema = new Schema<IReview>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
    adminReply: { type: String },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Review || mongoose.model<IReview>("Review", reviewSchema);
