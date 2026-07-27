import "server-only";

import mongoose, {
  Schema,
  type Document,
  type Model,
  type Types,
} from "mongoose";

export type NotificationType =
  | "booking_created"
  | "booking_confirmed"
  | "cleaner_assigned"
  | "assignment_new"
  | "assignment_accepted"
  | "assignment_declined"
  | "on_my_way"
  | "service_started"
  | "issue_reported"
  | "service_completed"
  | "booking_reminder"
  | "booking_cancelled"
  | "booking_rescheduled"
  | "payment_update"
  | "system";

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  href?: string;
  bookingId?: Types.ObjectId;
  dedupeKey?: string;
  readAt?: Date;
  emailStatus:
    | "not_requested"
    | "pending"
    | "processing"
    | "sent"
    | "failed"
    | "skipped";
  emailSentAt?: Date;
  emailError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "booking_created",
        "booking_confirmed",
        "cleaner_assigned",
        "assignment_new",
        "assignment_accepted",
        "assignment_declined",
        "on_my_way",
        "service_started",
        "issue_reported",
        "service_completed",
        "booking_reminder",
        "booking_cancelled",
        "booking_rescheduled",
        "payment_update",
        "system",
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    href: { type: String, trim: true, maxlength: 500, default: undefined },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      default: undefined,
      index: true,
    },
    dedupeKey: {
      type: String,
      trim: true,
      maxlength: 250,
      default: undefined,
    },
    readAt: { type: Date, default: undefined },
    emailStatus: {
      type: String,
      enum: [
        "not_requested",
        "pending",
        "processing",
        "sent",
        "failed",
        "skipped",
      ],
      default: "not_requested",
      required: true,
    },
    emailSentAt: { type: Date, default: undefined },
    emailError: { type: String, maxlength: 1000, default: undefined },
  },
  { timestamps: true, versionKey: false },
);

notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });
notificationSchema.index(
  { userId: 1, dedupeKey: 1 },
  {
    unique: true,
    partialFilterExpression: { dedupeKey: { $type: "string" } },
  },
);

const Notification =
  (mongoose.models.Notification as Model<INotification> | undefined) ??
  mongoose.model<INotification>("Notification", notificationSchema);

export default Notification;
