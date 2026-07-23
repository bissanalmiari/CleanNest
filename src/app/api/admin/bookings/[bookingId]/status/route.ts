// src/app/api/admin/bookings/[id]/status/route.ts
// PATCH /api/admin/bookings/:id/status
// Body: { status: string, note?: string }
// Admin-only. Validates the transition, updates the booking, and appends
// a BookingStatusHistory entry.

import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { changeBookingStatus } from "@/services/bookingManagementService";
import type { BookingStatus } from "@/types/enums";

const VALID_STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
];

async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new AppError("Admins only", 403);
  }
  return user;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { bookingId } = await params;

    const body = await request.json().catch(() => ({}));
    const { status, note } = body as { status?: string; note?: string };

    if (!status || !VALID_STATUSES.includes(status as BookingStatus)) {
      throw new AppError("A valid status is required", 422);
    }

    const booking = await changeBookingStatus(
      bookingId,
      status as BookingStatus,
      admin.id,
      note
    );

    return successResponse(booking);
  } catch (error) {
    return errorResponse(error);
  }
}
