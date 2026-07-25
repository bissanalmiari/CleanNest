import { NextRequest } from "next/server";

import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { reconcileElapsedBookings } from "@/services/bookingStatusAutomationService";

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

    return successResponse(
      await reconcileElapsedBookings(new Date(), {
        force: true,
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
