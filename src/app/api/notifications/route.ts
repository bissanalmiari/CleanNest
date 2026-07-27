import { NextRequest } from "next/server";

import { errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { requireUser } from "@/lib/auth";
import { listNotifications } from "@/services/notificationService";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireUser();
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? 20);
    const page = Number(request.nextUrl.searchParams.get("page") ?? 1);
    return successResponse(
      await listNotifications(
        currentUser.id,
        Number.isFinite(limit) ? limit : 20,
        Number.isFinite(page) ? page : 1
      )
    );
  } catch (error) {
    return errorResponse(error);
  }
}
