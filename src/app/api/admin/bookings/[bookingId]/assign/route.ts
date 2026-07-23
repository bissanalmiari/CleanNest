// src/app/api/admin/bookings/[id]/assign/route.ts
// POST /api/admin/bookings/:id/assign
// Body: { cleanerId: string }
// Admin-only. Creates a CleanerAssignment record for the booking.

import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { assignCleaner } from "@/services/bookingManagementService";

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
    const { cleanerId } = body as { cleanerId?: string };

    if (!cleanerId) {
      throw new AppError("cleanerId is required", 422);
    }

    const assignment = await assignCleaner(id, cleanerId, admin.id);
    return successResponse(assignment, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
