// src/app/api/admin/reports/revenue/route.ts
// GET /api/admin/reports/revenue?range=week|month|year|all
// Admin-only.

import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { getRevenueReport, type ReportRange } from "@/services/reportsService";

const VALID_RANGES: ReportRange[] = ["week", "month", "year", "all"];

async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new AppError("Admins only", 403);
  }
  return user;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const rangeParam = (searchParams.get("range") as ReportRange) || "month";

    if (!VALID_RANGES.includes(rangeParam)) {
      throw new AppError("Invalid range. Use week, month, year, or all.", 422);
    }

    const report = await getRevenueReport(rangeParam);
    return successResponse(report);
  } catch (error) {
    return errorResponse(error);
  }
}
