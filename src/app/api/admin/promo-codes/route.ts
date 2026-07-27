// src/app/api/admin/promo-codes/route.ts
// GET  /api/admin/promo-codes?search=&isActive=
// POST /api/admin/promo-codes  (body: CreatePromoCodeInput)
// Admin-only.

import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { getAllPromoCodes, createPromoCode } from "@/services/promoCodeManagementService";
import { createPromoCodeSchema } from "@/validators/promoCodeValidator";

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

    const codes = await getAllPromoCodes({
      search: searchParams.get("search") ?? undefined,
      isActive: isActiveParam === null ? undefined : isActiveParam === "true",
    });

    return successResponse({ promoCodes: codes, total: codes.length });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json().catch(() => ({}));
    const input = createPromoCodeSchema.parse(body);
    const promoCode = await createPromoCode(input);

    return successResponse(promoCode, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
