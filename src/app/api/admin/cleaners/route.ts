// src/app/api/admin/cleaners/route.ts
// GET  /api/admin/cleaners?search=&status=&page=&limit=  — list cleaners
// POST /api/admin/cleaners                               — create a cleaner
// Admin-only. Never returns passwordHash.

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { getAllCleaners, createCleaner, type CreateCleanerInput } from "@/services/cleanerService";

export async function GET(request: NextRequest) {
  try {
    await requireRole("admin");

    const { searchParams } = new URL(request.url);

    const result = await getAllCleaners({
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      page: Number(searchParams.get("page") ?? "1"),
      limit: Number(searchParams.get("limit") ?? "20"),
    });

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("admin");

    const body = (await request.json()) as CreateCleanerInput;
    const cleaner = await createCleaner(body);

    return successResponse(cleaner, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
