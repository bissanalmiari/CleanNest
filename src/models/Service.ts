import mongoose, { Schema, Document } from "mongoose";

export interface IService extends Document {
  name: string;
  slug: string;
  category: string;
  basePrice: number;
  baseDurationMinutes: number;
  isActive: boolean;
}

const serviceSchema = new Schema<IService>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: String, required: true },
    basePrice: { type: Number, required: true },
    baseDurationMinutes: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Service || mongoose.model<IService>("Service", serviceSchema);
