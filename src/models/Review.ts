import mongoose, { Schema, Document, Types, type Model } from "mongoose";

export interface IReview extends Document {
  bookingId: Types.ObjectId; // -> BOOKINGS.id (unique: one review per booking)
  customerId: Types.ObjectId; // -> USERS.id
  serviceId?: Types.ObjectId; // -> SERVICES.id
  rating: number;
  comment?: string;
  tags: string[];
  privateFeedback?: string;
  isVerified: boolean;
  // Parallel arrays — beforeImages[i] pairs with afterImages[i] as one
  // "before/after" shot of the same spot. Stored as public Supabase Storage URLs.
  beforeImages: string[];
  afterImages: string[];
  adminReply?: string;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", index: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true, maxlength: 1000 },
    tags: { type: [String], default: [] },
    privateFeedback: { type: String, trim: true, maxlength: 1000 },
    isVerified: { type: Boolean, default: true },
    beforeImages: { type: [String], default: [] },
    afterImages: { type: [String], default: [] },
    adminReply: { type: String, trim: true, maxlength: 1000 },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

reviewSchema.index({ isVisible: 1, createdAt: -1 });
reviewSchema.index({ serviceId: 1, isVisible: 1, createdAt: -1 });

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", reviewSchema);

export default Review;
