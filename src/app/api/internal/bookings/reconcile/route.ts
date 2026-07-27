import { NextRequest } from "next/server";

import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { reconcileElapsedBookings } from "@/services/bookingStatusAutomationService";
import { processNotificationQueue } from "@/services/notificationReminderService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      throw new AppError("Booking scheduler is not configured", 503);
    }

    if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
      throw new AppError("Unauthorized", 401);
    }

    const now = new Date();
    const bookingResult = await reconcileElapsedBookings(now, {
        force: true,
      });
    const notificationResult = await processNotificationQueue(now);
    return successResponse({
      ...bookingResult,
      notifications: notificationResult,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
