// src/app/api/admin/dashboard/route.ts
// GET /api/admin/dashboard?section=stats
// GET /api/admin/dashboard?section=revenue&range=week|month|year
// GET /api/admin/dashboard?section=reports&from=...&to=...&status=...&serviceId=...&page=1&limit=20
//
// A single admin-only endpoint that serves the three dashboard data needs.
// Keeping them under one route avoids scattering admin-guard logic across
// several files; each "section" simply delegates to dashboardService.

import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import {
  getDashboardStats,
  getRevenueStats,
  getBookingReports,
  getDashboardOverview,
  type RevenueRange,
} from "@/services/dashboardService";

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
    const section = searchParams.get("section") ?? "stats";

    if (section === "overview") {
      const range = (searchParams.get("range") as RevenueRange) || "week";
      if (!["week", "month", "year"].includes(range)) {
        throw new AppError("Invalid range. Use week, month, or year.", 422);
      }

      const overview = await getDashboardOverview({
        range,
        reportFilters: {
          from: searchParams.get("from") ?? undefined,
          to: searchParams.get("to") ?? undefined,
          status: searchParams.get("status") ?? undefined,
          serviceId: searchParams.get("serviceId") ?? undefined,
          page: Number(searchParams.get("page") ?? "1"),
          limit: Number(searchParams.get("limit") ?? "20"),
        },
      });

      return successResponse(overview);
    }

    if (section === "stats") {
      const stats = await getDashboardStats();
      return successResponse(stats);
    }

    if (section === "revenue") {
      const range = (searchParams.get("range") as RevenueRange) || "week";
      if (!["week", "month", "year"].includes(range)) {
        throw new AppError("Invalid range. Use week, month, or year.", 422);
      }
      const revenue = await getRevenueStats(range);
      return successResponse(revenue);
    }

    if (section === "reports") {
      const from = searchParams.get("from") ?? undefined;
      const to = searchParams.get("to") ?? undefined;
      const status = searchParams.get("status") ?? undefined;
      const serviceId = searchParams.get("serviceId") ?? undefined;
      const page = Number(searchParams.get("page") ?? "1");
      const limit = Number(searchParams.get("limit") ?? "20");

      const reports = await getBookingReports({
        from,
        to,
        status,
        serviceId,
        page,
        limit,
      });
      return successResponse(reports);
    }

    throw new AppError("Invalid section. Use overview, stats, revenue, or reports.", 422);
  } catch (error) {
    return errorResponse(error);
  }
}
