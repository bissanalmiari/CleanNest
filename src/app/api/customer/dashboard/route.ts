// src/app/api/customer/dashboard/route.ts
// GET /api/customer/dashboard?section=stats
// GET /api/customer/dashboard?section=upcoming&limit=5
// GET /api/customer/dashboard?section=history&status=&page=1&limit=10
//
// A single customer-only endpoint that serves the customer dashboard's data
// needs, mirroring how /api/admin/dashboard is structured for the admin
// side. Every query is scoped to the logged-in customer's own id.

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import {
  getCustomerDashboardStats,
  getUpcomingBookings,
  getBookingHistory,
  getCustomerDashboardOverview,
} from "@/services/customerDashboardService";

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole("customer");

    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section") ?? "stats";

    if (section === "overview") {
      const overview = await getCustomerDashboardOverview(user.id, {
        upcomingLimit: Number(searchParams.get("upcomingLimit") ?? "5"),
        historyPage: Number(searchParams.get("historyPage") ?? "1"),
        historyLimit: Number(searchParams.get("historyLimit") ?? "10"),
        historyStatus: searchParams.get("historyStatus") ?? undefined,
      });

      return successResponse(overview);
    }

    if (section === "stats") {
      const stats = await getCustomerDashboardStats(user.id);
      return successResponse(stats);
    }

    if (section === "upcoming") {
      const limit = Number(searchParams.get("limit") ?? "5");
      const bookings = await getUpcomingBookings(user.id, limit);
      return successResponse({ bookings });
    }

    if (section === "history") {
      const status = searchParams.get("status") ?? undefined;
      const page = Number(searchParams.get("page") ?? "1");
      const limit = Number(searchParams.get("limit") ?? "10");

      const history = await getBookingHistory(user.id, { status, page, limit });
      return successResponse(history);
    }

    throw new AppError("Invalid section. Use overview, stats, upcoming, or history.", 422);
  } catch (error) {
    return errorResponse(error);
  }
}
