// src/app/api/admin/users/route.ts
// GET /api/admin/users?search=&role=&status=&page=&limit=
// Admin-only. Returns a filtered, paginated list of users (no passwordHash).

import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { getAllUsers } from "@/services/userManagementService";

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

    const result = await getAllUsers({
      search: searchParams.get("search") ?? undefined,
      role: searchParams.get("role") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      page: Number(searchParams.get("page") ?? "1"),
      limit: Number(searchParams.get("limit") ?? "20"),
    });

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
