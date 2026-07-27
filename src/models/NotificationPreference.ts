import "server-only";

import mongoose, {
  Schema,
  type Document,
  type Model,
  type Types,
} from "mongoose";

export interface INotificationPreference extends Document {
  userId: Types.ObjectId;
  emailEnabled: boolean;
  bookingUpdates: boolean;
  assignmentUpdates: boolean;
  reminders: boolean;
  serviceReports: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    emailEnabled: { type: Boolean, default: true },
    bookingUpdates: { type: Boolean, default: true },
    assignmentUpdates: { type: Boolean, default: true },
    reminders: { type: Boolean, default: true },
    serviceReports: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);

const NotificationPreference =
  (mongoose.models.NotificationPreference as
    | Model<INotificationPreference>
    | undefined) ??
  mongoose.model<INotificationPreference>(
    "NotificationPreference",
    notificationPreferenceSchema,
  );

export default NotificationPreference;
