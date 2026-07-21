import mongoose, { Schema, Document } from "mongoose";

export interface IAddon extends Document {
  name: string;
  price: number;
  extraDurationMinutes: number;
  isActive: boolean;
}

const addonSchema = new Schema<IAddon>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    extraDurationMinutes: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Addon || mongoose.model<IAddon>("Addon", addonSchema);
