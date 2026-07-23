import mongoose, { Schema, Document, Types, type Model } from "mongoose";

export interface IAddress extends Document {
  customerId: Types.ObjectId; // -> USERS.id
  label: string;
  city: string;
  area: string;
  street: string;
  building?: string;
  floor?: string;
  apartment?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    label: { type: String, required: true },
    city: { type: String, required: true },
    area: { type: String, required: true },
    street: { type: String, required: true },
    building: { type: String },
    floor: { type: String },
    apartment: { type: String },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Address: Model<IAddress> =
  mongoose.models.Address || mongoose.model<IAddress>("Address", addressSchema);

export default Address;