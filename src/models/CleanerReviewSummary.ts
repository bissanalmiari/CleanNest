import mongoose, { Schema, Document, Types, type Model } from "mongoose";

export interface ICleanerReviewSummary extends Document {
  cleanerId: Types.ObjectId; // -> USERS.id (unique: one cached summary per cleaner)
  aiSummary: string;
  summaryGeneratedAt: Date;
  reviewCount: number;
  lastReviewId: Types.ObjectId; // -> REVIEWS.id, most recent review included in `aiSummary` — used to detect new reviews
  createdAt: Date;
  updatedAt: Date;
}

const cleanerReviewSummarySchema = new Schema<ICleanerReviewSummary>(
  {
    cleanerId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    aiSummary: { type: String, required: true, maxlength: 1000 },
    summaryGeneratedAt: { type: Date, required: true, default: Date.now },
    reviewCount: { type: Number, required: true, default: 0 },
    lastReviewId: { type: Schema.Types.ObjectId, ref: "Review", required: true },
  },
  { timestamps: true }
);

const CleanerReviewSummary: Model<ICleanerReviewSummary> =
  mongoose.models.CleanerReviewSummary ||
  mongoose.model<ICleanerReviewSummary>("CleanerReviewSummary", cleanerReviewSummarySchema);

export default CleanerReviewSummary;
