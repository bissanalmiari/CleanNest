// GET   /api/admin/settings  -> current site settings
// PATCH /api/admin/settings  -> update site settings (admin only)
import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { updateSettingsSchema } from "@/validators/settingsValidator";
import { getSettings, updateSettings } from "@/services/settingsService";
import { successResponse } from "@/lib/apiResponse";
import { errorResponse } from "@/lib/apiError";

export async function GET() {
  try {
    await requireRole("admin");
    const settings = await getSettings();
    return successResponse({ settings });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireRole("admin");
    const body = await req.json();
    const input = updateSettingsSchema.parse(body);
    const settings = await updateSettings(input);
    return successResponse({ settings });
  } catch (error) {
    return errorResponse(error);
  }
}
