// src/app/api/customer/payments/route.ts
// GET /api/customer/payments?status=&page=&limit=
// Customer-only. Lists payments for the logged-in customer's own bookings.

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/rbac";
import { errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { listPaymentsForCustomer } from "@/services/paymentService";

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole("customer");

    const { searchParams } = new URL(request.url);

    const result = await listPaymentsForCustomer(user.id, {
      status: searchParams.get("status") ?? undefined,
      page: Number(searchParams.get("page") ?? "1"),
      limit: Number(searchParams.get("limit") ?? "10"),
    });

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}