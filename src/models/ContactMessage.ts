import mongoose, { Schema, Document, Types, type Model } from "mongoose";
import type { ContactMessageStatus } from "@/types/enums";

export interface IContactMessage extends Document {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  assignedAdminId?: Types.ObjectId; // -> USERS.id
  createdAt: Date;
}

const contactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    subject: { type: String, required: true },
    message: { type: String, required: true, maxlength: 2000 },
    status: { type: String, enum: ["new", "in_progress", "resolved"], default: "new" },
    assignedAdminId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const ContactMessage =
  (mongoose.models.ContactMessage as Model<IContactMessage> | undefined) ??
  mongoose.model<IContactMessage>("ContactMessage", contactMessageSchema);

export default ContactMessage;
