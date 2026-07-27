import { errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { requireRole } from "@/lib/auth";
import {
  getCleanerAvailability,
  updateCleanerAvailability,
  type CleanerAvailabilityDay,
} from "@/services/cleanerAvailabilityService";

export async function GET() {
  try {
    const cleaner = await requireRole("cleaner");
    return successResponse(await getCleanerAvailability(cleaner.id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const cleaner = await requireRole("cleaner");
    const body = (await request.json()) as {
      days?: CleanerAvailabilityDay[];
    };
    return successResponse(await updateCleanerAvailability(cleaner.id, body.days ?? []));
  } catch (error) {
    return errorResponse(error);
  }
}
