import { z } from "zod";

// All fields optional — an admin only sends the fields they changed and
// the service merges them onto the existing singleton document.
export const updateSettingsSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required").max(120).optional(),
  supportEmail: z.string().trim().email("Enter a valid email").optional(),
  supportPhone: z.string().trim().max(30).optional(),
  businessAddress: z.string().trim().max(300).optional(),
  bookingLeadTimeHours: z.coerce.number().int().min(0).max(168).optional(),
  cancellationWindowHours: z.coerce.number().int().min(0).max(168).optional(),
  maintenanceMode: z.boolean().optional(),
  emailNotificationsEnabled: z.boolean().optional(),
  smsNotificationsEnabled: z.boolean().optional(),
});

export type UpdateSettingsValues = z.infer<typeof updateSettingsSchema>;
