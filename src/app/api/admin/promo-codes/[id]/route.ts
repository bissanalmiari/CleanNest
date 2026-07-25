// src/app/api/admin/promo-codes/[id]/route.ts
// GET    /api/admin/promo-codes/:id
// PATCH  /api/admin/promo-codes/:id  (body: UpdatePromoCodeInput)
// DELETE /api/admin/promo-codes/:id
// Admin-only.

import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import {
  getPromoCodeById,
  updatePromoCode,
  deletePromoCode,
} from "@/services/promoCodeManagementService";
import {
  promoCodeIdParamSchema,
  updatePromoCodeSchema,
} from "@/validators/promoCodeValidator";

async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new AppError("Admins only", 403);
  }
  return user;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = promoCodeIdParamSchema.parse(await params);

    const promoCode = await getPromoCodeById(id);
    return successResponse(promoCode);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = promoCodeIdParamSchema.parse(await params);

    const body = await request.json().catch(() => ({}));
    const input = updatePromoCodeSchema.parse(body);
    const promoCode = await updatePromoCode(id, input);

    return successResponse(promoCode);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = promoCodeIdParamSchema.parse(await params);

    const result = await deletePromoCode(id);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
