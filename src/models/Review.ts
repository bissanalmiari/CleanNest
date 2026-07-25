import mongoose, { Schema, Document, Types, type Model } from "mongoose";

export interface IReview extends Document {
  bookingId: Types.ObjectId; // -> BOOKINGS.id (unique: one review per booking)
  customerId: Types.ObjectId; // -> USERS.id
  rating: number;
  comment?: string;
  // Parallel arrays — beforeImages[i] pairs with afterImages[i] as one
  // "before/after" shot of the same spot. Stored as public Supabase Storage URLs.
  beforeImages: string[];
  afterImages: string[];
  adminReply?: string;
  isVisible: boolean;
  createdAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true, maxlength: 1000 },
    beforeImages: { type: [String], default: [] },
    afterImages: { type: [String], default: [] },
    adminReply: { type: String, trim: true, maxlength: 1000 },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

reviewSchema.index({ isVisible: 1, createdAt: -1 });

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", reviewSchema);

export default Review;
