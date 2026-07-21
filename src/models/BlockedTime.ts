import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBlockedTime extends Document {
  cleanerId?: Types.ObjectId; // -> USERS.id (optional: null = company-wide block)
  startDatetime: Date;
  endDatetime: Date;
  reason?: string;
  createdByUserId: Types.ObjectId; // -> USERS.id
}

const blockedTimeSchema = new Schema<IBlockedTime>(
  {
    cleanerId: { type: Schema.Types.ObjectId, ref: "User" },
    startDatetime: { type: Date, required: true },
    endDatetime: { type: Date, required: true },
    reason: { type: String },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.models.BlockedTime ||
  mongoose.model<IBlockedTime>("BlockedTime", blockedTimeSchema);
