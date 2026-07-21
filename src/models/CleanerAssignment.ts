import mongoose, { Schema, Document, Types } from "mongoose";
import type { AssignmentStatus } from "@/types/enums";

export interface ICleanerAssignment extends Document {
  bookingId: Types.ObjectId; // -> BOOKINGS.id
  cleanerId: Types.ObjectId; // -> USERS.id
  assignedByUserId: Types.ObjectId; // -> USERS.id
  assignedAt: Date;
  status: AssignmentStatus;
}

const cleanerAssignmentSchema = new Schema<ICleanerAssignment>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    cleanerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["assigned", "accepted", "declined", "completed"],
      default: "assigned",
    },
  },
  { timestamps: true }
);

export default mongoose.models.CleanerAssignment ||
  mongoose.model<ICleanerAssignment>("CleanerAssignment", cleanerAssignmentSchema);
