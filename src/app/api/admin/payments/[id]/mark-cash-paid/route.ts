// src/app/api/admin/payments/[id]/mark-cash-paid/route.ts
// PATCH /api/admin/payments/:id/mark-cash-paid
// Admin-only. Marks a cash payment as received after service completion.

import { requireRole } from "@/lib/rbac";
import { errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { markCashPaymentReceived } from "@/services/paymentService";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("admin");
    const { id } = await params;

    const payment = await markCashPaymentReceived(id);

    return successResponse(payment);
  } catch (error) {
    return errorResponse(error);
  }
}
