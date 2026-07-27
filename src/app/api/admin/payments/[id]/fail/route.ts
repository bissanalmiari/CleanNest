// src/app/api/admin/payments/[id]/fail/route.ts
// PATCH /api/admin/payments/:id/fail
// Body: { reason?: string }
// Admin-only. Manually marks a stuck/unsuccessful payment as failed.

import { requireRole } from "@/lib/rbac";
import { errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { markPaymentFailed } from "@/services/paymentService";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("admin");
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const { reason } = body as { reason?: string };

    const payment = await markPaymentFailed(id, reason);

    return successResponse(payment);
  } catch (error) {
    return errorResponse(error);
  }
}
