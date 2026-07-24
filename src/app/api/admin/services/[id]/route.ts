// src/app/api/admin/services/[id]/route.ts
// GET    /api/admin/services/:id
// PATCH  /api/admin/services/:id  (body: UpdateServiceInput)
// DELETE /api/admin/services/:id
// Admin-only.

import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { updateServiceSchema } from "@/validators/serviceValidator";
import {
  getServiceById,
  updateService,
  deleteService,
} from "@/services/serviceManagementService";

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
    const { id } = await params;

    const service = await getServiceById(id);
    return successResponse(service);
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
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const input = updateServiceSchema.parse(body);
    const service = await updateService(id, input);

    return successResponse(service);
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
    const { id } = await params;

    const result = await deleteService(id);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
