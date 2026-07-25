import "server-only";
import { connectDB } from "@/lib/db";
import Settings, { SETTINGS_SINGLETON_KEY, type ISettings } from "@/models/Settings";
import type { UpdateSettingsValues } from "@/validators/settingsValidator";

export interface SettingsDTO {
  businessName: string;
  supportEmail: string;
  supportPhone?: string;
  businessAddress?: string;
  bookingLeadTimeHours: number;
  cancellationWindowHours: number;
  maintenanceMode: boolean;
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  updatedAt: string;
}

function toDTO(doc: ISettings): SettingsDTO {
  return {
    businessName: doc.businessName,
    supportEmail: doc.supportEmail,
    supportPhone: doc.supportPhone,
    businessAddress: doc.businessAddress,
    bookingLeadTimeHours: doc.bookingLeadTimeHours,
    cancellationWindowHours: doc.cancellationWindowHours,
    maintenanceMode: doc.maintenanceMode,
    emailNotificationsEnabled: doc.emailNotificationsEnabled,
    smsNotificationsEnabled: doc.smsNotificationsEnabled,
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/** Returns the singleton settings document, creating it with defaults on first access. */
export async function getSettings(): Promise<SettingsDTO> {
  await connectDB();

  const doc = await Settings.findOneAndUpdate(
    { key: SETTINGS_SINGLETON_KEY },
    { $setOnInsert: { key: SETTINGS_SINGLETON_KEY } },
    { upsert: true, new: true }
  );

  return toDTO(doc);
}

/** Admin-only: merges the given fields onto the singleton settings document. */
export async function updateSettings(input: UpdateSettingsValues): Promise<SettingsDTO> {
  await connectDB();

  const doc = await Settings.findOneAndUpdate(
    { key: SETTINGS_SINGLETON_KEY },
    { $set: input, $setOnInsert: { key: SETTINGS_SINGLETON_KEY } },
    { upsert: true, new: true }
  );

  return toDTO(doc);
}
