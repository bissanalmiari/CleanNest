import mongoose, { Schema, Document } from "mongoose";

export interface IServiceArea extends Document {
  city: string;
  area: string;
  postalCode: string;
  serviceFee: number;
  isActive: boolean;
}

const serviceAreaSchema = new Schema<IServiceArea>(
  {
    city: { type: String, required: true },
    area: { type: String, required: true },
    postalCode: { type: String, required: true },
    serviceFee: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.ServiceArea ||
  mongoose.model<IServiceArea>("ServiceArea", serviceAreaSchema);
