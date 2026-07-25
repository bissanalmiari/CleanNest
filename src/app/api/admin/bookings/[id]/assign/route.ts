// src/app/api/admin/bookings/[id]/assign/route.ts
// POST /api/admin/bookings/:id/assign
// Body: { cleanerId: string }
// Admin-only. Creates a CleanerAssignment record for the booking.

import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { assignCleaners } from "@/services/bookingManagementService";

async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new AppError("Admins only", 403);
  }
  return user;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const { cleanerId, cleanerIds } = body as {
      cleanerId?: string;
      cleanerIds?: string[];
    };
    const selectedCleanerIds = Array.isArray(cleanerIds)
      ? cleanerIds
      : cleanerId
        ? [cleanerId]
        : [];

    if (selectedCleanerIds.length === 0) {
      throw new AppError("Select at least one cleaner", 422);
    }

    const assignments = await assignCleaners(id, selectedCleanerIds, admin.id);
    return successResponse({ assignments }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
