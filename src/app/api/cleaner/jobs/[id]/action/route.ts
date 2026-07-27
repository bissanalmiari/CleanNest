import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { requireRole } from "@/lib/auth";
import { performCleanerJobAction } from "@/services/cleanerPortalService";

const ACTIONS = [
  "accept",
  "decline",
  "on_my_way",
  "start",
  "demo_start",
  "complete",
] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const cleaner = await requireRole("cleaner");
    const { id } = await params;
    const body = (await request.json()) as {
      action?: string;
      location?: {
        latitude: number;
        longitude: number;
        accuracy?: number;
      };
    };
    if (!ACTIONS.includes(body.action as (typeof ACTIONS)[number])) {
      throw new AppError("Invalid cleaner job action", 422);
    }
    if (body.location) {
      const { latitude, longitude, accuracy } = body.location;
      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180 ||
        (accuracy !== undefined &&
          (!Number.isFinite(accuracy) || accuracy < 0))
      ) {
        throw new AppError("Invalid check-in location", 422);
      }
    }
    return successResponse(
      await performCleanerJobAction(
        cleaner.id,
        id,
        body.action as (typeof ACTIONS)[number],
        body.location,
      ),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
