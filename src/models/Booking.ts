import mongoose, { Schema, Document, Types, type Model } from "mongoose";
import type {
  BookingSource,
  BookingStatus,
  BookingFrequency,
  PropertyType,
  PaymentMethod,
  PaymentStatus,
} from "@/types/enums";

export interface IBooking extends Document {
  bookingNumber: string;
  customerId: Types.ObjectId; // -> USERS.id
  serviceId: Types.ObjectId; // -> SERVICES.id
  addressId: Types.ObjectId; // -> ADDRESSES.id (ERD: addrics_id, corrected here)
  createdByUserId: Types.ObjectId; // -> USERS.id (customer or admin who created it)
  serviceAreaId: Types.ObjectId; // -> SERVICE_AREAS.id
  promoCodeId?: Types.ObjectId; // -> PROMO_CODES.id (optional)

  source: BookingSource;
  status: BookingStatus;
  frequency: BookingFrequency;

  bookingDate: Date;
  startTime: string; // e.g. "09:00"
  endTime: string; // e.g. "11:00"

  propertyType: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  propertySize?: number;

  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;

  customerNotes?: string;
  adminNotes?: string;

  createdAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    bookingNumber: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    addressId: { type: Schema.Types.ObjectId, ref: "Address", required: true },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    serviceAreaId: { type: Schema.Types.ObjectId, ref: "ServiceArea", required: true },
    promoCodeId: { type: Schema.Types.ObjectId, ref: "PromoCode" },

    source: { type: String, enum: ["customer", "admin"], default: "customer" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
    frequency: {
      type: String,
      enum: ["one_time", "weekly", "biweekly", "monthly"],
      default: "one_time",
    },

    bookingDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },

    propertyType: {
      type: String,
      enum: ["apartment", "house", "office", "other"],
      required: true,
    },
    bedrooms: { type: Number },
    bathrooms: { type: Number },
    propertySize: { type: Number },

    totalAmount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "wallet", "bank_transfer"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending", "paid", "refunded", "failed"],
      default: "unpaid",
    },

    customerNotes: { type: String },
    adminNotes: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

//Bissan chnge this 
const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", bookingSchema);
 
export default Booking;