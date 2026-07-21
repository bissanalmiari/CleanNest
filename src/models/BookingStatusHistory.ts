import mongoose, { Schema, Document, Types } from "mongoose";
import type { BookingStatus } from "@/types/enums";

export interface IBookingStatusHistory extends Document {
  bookingId: Types.ObjectId; // -> BOOKINGS.id
  previousStatus?: BookingStatus;
  newStatus: BookingStatus;
  changedByUserId: Types.ObjectId; // -> USERS.id
  createdAt: Date;
}

const bookingStatusHistorySchema = new Schema<IBookingStatusHistory>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    previousStatus: {
      type: String,
      enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"],
    },
    newStatus: {
      type: String,
      enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"],
      required: true,
    },
    changedByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.BookingStatusHistory ||
  mongoose.model<IBookingStatusHistory>("BookingStatusHistory", bookingStatusHistorySchema);
