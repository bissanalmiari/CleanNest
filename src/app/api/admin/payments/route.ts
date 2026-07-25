// src/app/api/admin/payments/route.ts
// GET /api/admin/payments?status=&method=&search=&dateFrom=&dateTo=&page=&limit=
// Admin-only. Returns a filtered, paginated list of every payment, plus a
// per-status summary (count + total amount) used for the header stat cards.

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/rbac";
import { errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { getAllPayments } from "@/services/paymentService";

export async function GET(request: NextRequest) {
  try {
    await requireRole("admin");

    const { searchParams } = new URL(request.url);

    const result = await getAllPayments({
      status: searchParams.get("status") ?? undefined,
      method: searchParams.get("method") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      page: Number(searchParams.get("page") ?? "1"),
      limit: Number(searchParams.get("limit") ?? "20"),
    });

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
