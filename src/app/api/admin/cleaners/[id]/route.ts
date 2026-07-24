// src/app/api/admin/cleaners/[id]/route.ts
// GET    /api/admin/cleaners/:id  — cleaner detail (+ assignment count)
// PATCH  /api/admin/cleaners/:id  — update cleaner
// DELETE /api/admin/cleaners/:id  — delete cleaner
// Admin-only. Never returns passwordHash.

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import {
  getCleanerById,
  updateCleaner,
  deleteCleaner,
  type UpdateCleanerInput,
} from "@/services/cleanerService";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole("admin");
    const { id } = await params;

    const result = await getCleanerById(id);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole("admin");
    const { id } = await params;

    const body = (await request.json()) as UpdateCleanerInput;
    const cleaner = await updateCleaner(id, body);

    return successResponse(cleaner);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireRole("admin");
    const { id } = await params;

    const result = await deleteCleaner(id, admin.id);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
