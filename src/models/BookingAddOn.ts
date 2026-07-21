import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBookingAddon extends Document {
  bookingId: Types.ObjectId; // -> BOOKINGS.id
  addonId: Types.ObjectId; // -> ADDONS.id
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

const bookingAddonSchema = new Schema<IBookingAddon>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    addonId: { type: Schema.Types.ObjectId, ref: "Addon", required: true },
    quantity: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.BookingAddon ||
  mongoose.model<IBookingAddon>("BookingAddon", bookingAddonSchema);
