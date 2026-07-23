// src/app/api/admin/bookings/[id]/route.ts
// GET /api/admin/bookings/:id
// Admin-only. Returns full booking detail: booking, cleaner assignments,
// status history, and the list of cleaners available to assign.

import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { getBookingById } from "@/services/bookingManagementService";

async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new AppError("Admins only", 403);
  }
  return user;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const result = await getBookingById(id);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
