import { NextRequest } from "next/server";

import { errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { requireRole } from "@/lib/auth";
import { listCleanerJobs } from "@/services/cleanerPortalService";

export async function GET(request: NextRequest) {
  try {
    const cleaner = await requireRole("cleaner");
    const scope = request.nextUrl.searchParams.get("scope") === "upcoming" ? "upcoming" : "today";
    return successResponse(await listCleanerJobs(cleaner.id, scope));
  } catch (error) {
    return errorResponse(error);
  }
}
