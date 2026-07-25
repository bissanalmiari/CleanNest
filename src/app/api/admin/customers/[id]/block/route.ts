// src/app/api/admin/customers/[id]/block/route.ts
// PATCH /api/admin/customers/:id/block  — body: { action: "block" | "unblock" }
// Admin-only.

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { blockCustomer, unblockCustomer } from "@/services/customerManagementService";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole("admin");
    const { id } = await params;

    const body = (await request.json()) as { action?: string };

    if (body.action === "block") {
      const customer = await blockCustomer(id);
      return successResponse(customer);
    }

    if (body.action === "unblock") {
      const customer = await unblockCustomer(id);
      return successResponse(customer);
    }

    throw new AppError('action must be "block" or "unblock"', 400);
  } catch (error) {
    return errorResponse(error);
  }
}
