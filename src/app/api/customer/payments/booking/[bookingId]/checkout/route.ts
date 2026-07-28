// src/app/api/customer/payments/booking/[bookingId]/checkout/route.ts
// POST /api/customer/payments/booking/:bookingId/checkout
// Customer-only. Creates a Stripe Checkout Session for a card booking and
// returns the hosted checkout URL to redirect the browser to.

import { requireRole } from "@/lib/rbac";
import { errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { createStripeCheckoutSession } from "@/services/paymentService";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const user = await requireRole("customer");
    const { bookingId } = await params;

    const result = await createStripeCheckoutSession(
      bookingId,
      user.id,
      new URL(request.url).origin
    );

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
