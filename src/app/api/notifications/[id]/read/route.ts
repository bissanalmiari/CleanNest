import { errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { requireUser } from "@/lib/auth";
import { markNotificationRead } from "@/services/notificationService";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await requireUser();
    const { id } = await params;
    return successResponse(await markNotificationRead(currentUser.id, id));
  } catch (error) {
    return errorResponse(error);
  }
}
