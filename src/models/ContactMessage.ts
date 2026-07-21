import mongoose, { Schema, Document, Types } from "mongoose";
import type { ContactMessageStatus } from "@/types/enums";

export interface IContactMessage extends Document {
  name: string;
  email: string;
  phone?: string;
  subject: string;
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
    status: { type: String, enum: ["new", "in_progress", "resolved"], default: "new" },
    assignedAdminId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.ContactMessage ||
  mongoose.model<IContactMessage>("ContactMessage", contactMessageSchema);
