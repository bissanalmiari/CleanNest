// src/app/api/admin/customers/[id]/route.ts
// GET    /api/admin/customers/:id  — customer detail (+ booking count)
// PATCH  /api/admin/customers/:id  — update customer
// DELETE /api/admin/customers/:id  — delete customer
// Admin-only. Never returns passwordHash.

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import {
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  type UpdateCustomerInput,
} from "@/services/customerManagementService";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole("admin");
    const { id } = await params;

    const result = await getCustomerById(id);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole("admin");
    const { id } = await params;

    const body = (await request.json()) as UpdateCustomerInput;
    const customer = await updateCustomer(id, body);

    return successResponse(customer);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireRole("admin");
    const { id } = await params;

    const result = await deleteCustomer(id, admin.id);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
