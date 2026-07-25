// src/app/api/admin/payments/[id]/refund/route.ts
// PATCH /api/admin/payments/:id/refund
// Body: { amount?: number, reason?: string }
// Admin-only. Refunds a paid card payment (full amount by default).

import { requireRole } from "@/lib/rbac";
import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { refundPayment } from "@/services/paymentService";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("admin");
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const { amount, reason } = body as { amount?: number; reason?: string };

    if (amount !== undefined && (typeof amount !== "number" || amount < 0)) {
      throw new AppError("Refund amount must be a positive number", 422);
    }

    const payment = await refundPayment(id, amount, reason);

    return successResponse(payment);
  } catch (error) {
    return errorResponse(error);
  }
}
