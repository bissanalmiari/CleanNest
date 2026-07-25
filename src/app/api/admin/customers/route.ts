// src/app/api/admin/customers/route.ts
// GET  /api/admin/customers?search=&status=&page=&limit=  — list customers
// POST /api/admin/customers                               — create a customer
// Admin-only. Never returns passwordHash.

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import {
  getAllCustomers,
  createCustomer,
  type CreateCustomerInput,
} from "@/services/customerManagementService";

export async function GET(request: NextRequest) {
  try {
    await requireRole("admin");

    const { searchParams } = new URL(request.url);

    const result = await getAllCustomers({
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

    const body = (await request.json()) as CreateCustomerInput;
    const customer = await createCustomer(body);

    return successResponse(customer, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
