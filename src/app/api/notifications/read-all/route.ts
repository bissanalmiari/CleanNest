import { errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { requireUser } from "@/lib/auth";
import { markAllNotificationsRead } from "@/services/notificationService";

export async function POST() {
  try {
    const currentUser = await requireUser();
    return successResponse(await markAllNotificationsRead(currentUser.id));
  } catch (error) {
    return errorResponse(error);
  }
}
