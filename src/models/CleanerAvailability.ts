import mongoose, { Schema, Document, Types } from "mongoose";
import type { DayOfWeek } from "@/types/enums";

export interface ICleanerAvailability extends Document {
  cleanerId: Types.ObjectId; // -> USERS.id
  dayOfWeek: DayOfWeek;
  startTime: string; // e.g. "08:00"
  endTime: string; // e.g. "16:00"
  isAvailable: boolean;
}

const cleanerAvailabilitySchema = new Schema<ICleanerAvailability>(
  {
    cleanerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dayOfWeek: {
      type: String,
      enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      required: true,
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.CleanerAvailability ||
  mongoose.model<ICleanerAvailability>("CleanerAvailability", cleanerAvailabilitySchema);
