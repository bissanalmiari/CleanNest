import { errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { requireRole } from "@/lib/auth";
import { getCleanerJob } from "@/services/cleanerPortalService";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cleaner = await requireRole("cleaner");
    const { id } = await params;
    return successResponse(await getCleanerJob(cleaner.id, id));
  } catch (error) {
    return errorResponse(error);
  }
}
