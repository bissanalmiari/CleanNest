// src/app/api/customer/payments/verify/route.ts
// GET /api/customer/payments/verify?session_id=cs_test_...
// Customer-only. Confirms a Stripe Checkout Session right after Stripe
// redirects the customer back to /payments/success, so the UI can reflect
// the result immediately (the webhook is still the source of truth in the
// background in case the customer closes the tab too early).

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/rbac";
import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { confirmStripeCheckoutSession } from "@/services/paymentService";

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole("customer");

    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      throw new AppError("Missing session_id", 422);
    }

    const payment = await confirmStripeCheckoutSession(sessionId, user.id);

    return successResponse(payment);
  } catch (error) {
    return errorResponse(error);
  }
}