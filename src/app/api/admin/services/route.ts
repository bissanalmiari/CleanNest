// src/app/api/admin/services/route.ts
// GET  /api/admin/services?search=&category=&isActive=&page=&limit=
// POST /api/admin/services  (body: CreateServiceInput)
// Admin-only.

import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { createServiceSchema } from "@/validators/serviceValidator";
import {
  getAllServices,
  createService,
} from "@/services/serviceManagementService";

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
    const isActiveParam = searchParams.get("isActive");

    const result = await getAllServices({
      search: searchParams.get("search") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      isActive:
        isActiveParam === null ? undefined : isActiveParam === "true",
      page: Number(searchParams.get("page") ?? "1"),
      limit: Number(searchParams.get("limit") ?? "50"),
    });

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json().catch(() => ({}));
    const input = createServiceSchema.parse(body);
    const service = await createService(input);

    return successResponse(service, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
