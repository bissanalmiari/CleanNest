import { NextRequest, NextResponse } from "next/server";

import { AppError, errorResponse } from "@/lib/apiError";
import { getDashboardOverview, type RevenueRange } from "@/services/dashboardService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_RANGES: RevenueRange[] = ["week", "month", "year"];

function requireKinoAuthorization(request: NextRequest) {
  const configuredSecret = process.env.KINO_INTEGRATION_SECRET;
  if (!configuredSecret) {
    throw new AppError("KINO integration is not configured", 503);
  }

  if (request.headers.get("authorization") !== `Bearer ${configuredSecret}`) {
    throw new AppError("Unauthorized", 401);
  }
}

function isRevenueRange(value: string): value is RevenueRange {
  return ALLOWED_RANGES.includes(value as RevenueRange);
}

// Read-only server-to-server endpoint. It deliberately does not use the
// CleanNest browser session cookie or expose any mutation methods.
export async function GET(request: NextRequest) {
  try {
    requireKinoAuthorization(request);

    const rangeParam = request.nextUrl.searchParams.get("range") ?? "week";
    if (!isRevenueRange(rangeParam)) {
      throw new AppError("Invalid range. Use week, month, or year.", 422);
    }

    const overview = await getDashboardOverview({
      range: rangeParam,
      reportFilters: {
        page: 1,
        limit: 20,
      },
    });

    return NextResponse.json(
      {
        success: true,
        integration: "cleannest",
        resource: "dashboard",
        range: rangeParam,
        generatedAt: new Date().toISOString(),
        data: overview,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
