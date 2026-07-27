import mongoose, { Schema, Document, type Model } from "mongoose";

// Settings is a singleton — there is ever only one document, always
// looked up by this fixed key, the same pattern used for feature-flag /
// config collections elsewhere.
export const SETTINGS_SINGLETON_KEY = "global";

export interface ISettings extends Document {
  key: string;
  businessName: string;
  supportEmail: string;
  supportPhone?: string;
  businessAddress?: string;
  bookingLeadTimeHours: number; // minimum notice a customer must give before a booking
  cancellationWindowHours: number; // how close to the appointment a customer may still cancel free of charge
  maintenanceMode: boolean; // if true, public booking is temporarily disabled
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    key: { type: String, required: true, unique: true, default: SETTINGS_SINGLETON_KEY },
    businessName: { type: String, required: true, trim: true, default: "CleanNest" },
    supportEmail: {
      type: String,
      required: true,
      trim: true,
      default: "cleannest.project@gmail.com",
    },
    supportPhone: { type: String, trim: true },
    businessAddress: { type: String, trim: true },
    bookingLeadTimeHours: { type: Number, min: 0, max: 168, default: 12 },
    cancellationWindowHours: { type: Number, min: 0, max: 168, default: 24 },
    maintenanceMode: { type: Boolean, default: false },
    emailNotificationsEnabled: { type: Boolean, default: true },
    smsNotificationsEnabled: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>("Settings", settingsSchema);

export default Settings;
