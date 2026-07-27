import { errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { requireUser } from "@/lib/auth";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/services/notificationService";
import type { NotificationPreferences } from "@/types/notification";

export async function GET() {
  try {
    const currentUser = await requireUser();
    return successResponse(await getNotificationPreferences(currentUser.id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const currentUser = await requireUser();
    const body = (await request.json()) as Partial<NotificationPreferences>;
    return successResponse(await updateNotificationPreferences(currentUser.id, body));
  } catch (error) {
    return errorResponse(error);
  }
}
