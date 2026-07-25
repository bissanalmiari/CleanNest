// src/app/api/customer/payments/[paymentId]/route.ts
// GET /api/customer/payments/:paymentId
// Customer-only. Returns one payment, only if it belongs to the caller.

import { requireRole } from "@/lib/rbac";
import { errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { getPaymentForCustomer } from "@/services/paymentService";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const user = await requireRole("customer");
    const { paymentId } = await params;

    const payment = await getPaymentForCustomer(paymentId, user.id);

    return successResponse(payment);
  } catch (error) {
    return errorResponse(error);
  }
}
