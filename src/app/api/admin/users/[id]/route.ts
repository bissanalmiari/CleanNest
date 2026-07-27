// src/app/api/admin/users/[id]/route.ts
// GET /api/admin/users/:id      → user detail + booking count
// DELETE /api/admin/users/:id   → permanently delete the user (hard delete)
// Admin-only.

import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { getUserById, deleteUser } from "@/services/userManagementService";

async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new AppError("Admins only", 403);
  }
  return user;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const result = await getUserById(id);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const result = await deleteUser(id, admin.id);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
