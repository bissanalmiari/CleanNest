// src/app/api/cleaner/[id]/summary/route.ts
// GET /api/cleaner/:id/summary — cached AI summary of the cleaner's last 20
// reviews, regenerated only when new reviews have come in. Any logged-in
// user may view it; basic per-user rate limiting guards the (potentially
// AI-triggering) call.

import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { enforceRateLimit } from "@/lib/rateLimit";
import { getCleanerReviewSummary } from "@/services/reviewSummaryService";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const RATE_LIMIT = { limit: 10, windowMs: 60_000 };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    enforceRateLimit(`cleaner-summary:${user.id}`, RATE_LIMIT);

    const { id } = await params;
    const result = await getCleanerReviewSummary(id);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
