// src/app/api/admin/bookings/route.ts
// GET /api/admin/bookings?status=&dateFrom=&dateTo=&serviceId=&search=&page=&limit=
// Admin-only. Returns a filtered, paginated list of bookings.

import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { createAdminBooking } from "@/services/bookingCreationService";
import { getAllBookings } from "@/services/bookingManagementService";
import { adminCreateBookingSchema } from "@/validators/bookingValidator";

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

    const result = await getAllBookings({
      status: searchParams.get("status") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      customerId: searchParams.get("customerId") ?? undefined,
      serviceId: searchParams.get("serviceId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      page: Number(searchParams.get("page") ?? "1"),
      limit: Number(searchParams.get("limit") ?? "20"),
    });

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    let requestBody: unknown;

    try {
      requestBody = await request.json();
    } catch {
      throw new AppError("The request body must contain valid JSON.", 400);
    }

    const validation = adminCreateBookingSchema.safeParse(requestBody);

    if (!validation.success) {
      const message = validation.error.issues
        .map((issue) => {
          const field = issue.path.length > 0 ? issue.path.join(".") : "booking";
          return `${field}: ${issue.message}`;
        })
        .join(" ");

      throw new AppError(message, 422);
    }

    const result = await createAdminBooking({
      adminId: admin.id,
      input: validation.data,
    });

    return successResponse(result, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
