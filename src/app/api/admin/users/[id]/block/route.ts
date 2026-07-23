// src/app/api/admin/users/[id]/block/route.ts
// PATCH /api/admin/users/:id/block
// Body: { action: "block" | "unblock" }
// Admin-only.

import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import {
  blockUser,
  unblockUser,
} from "@/services/userManagementService";

async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new AppError("Admins only", 403);
  }
  return user;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const { action } = body as { action?: string };

    if (action !== "block" && action !== "unblock") {
      throw new AppError('action must be "block" or "unblock"', 422);
    }

    const user =
      action === "block"
        ? await blockUser(id, admin.id)
        : await unblockUser(id);

    return successResponse(user);
  } catch (error) {
    return errorResponse(error);
  }
}
