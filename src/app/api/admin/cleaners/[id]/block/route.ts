// src/app/api/admin/cleaners/[id]/block/route.ts
// PATCH /api/admin/cleaners/:id/block  — body: { action: "block" | "unblock" }
// Admin-only.

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { blockCleaner, unblockCleaner } from "@/services/cleanerService";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole("admin");
    const { id } = await params;

    const body = (await request.json()) as { action?: string };

    if (body.action === "block") {
      const cleaner = await blockCleaner(id);
      return successResponse(cleaner);
    }

    if (body.action === "unblock") {
      const cleaner = await unblockCleaner(id);
      return successResponse(cleaner);
    }

    throw new AppError('action must be "block" or "unblock"', 400);
  } catch (error) {
    return errorResponse(error);
  }
}
