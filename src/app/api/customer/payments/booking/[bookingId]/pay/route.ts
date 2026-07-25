// src/app/api/customer/payments/booking/[bookingId]/pay/route.ts
// POST /api/customer/payments/booking/:bookingId/pay
// Body: { cardNumber, expiry, cvv, cardholderName }
// Customer-only. Simulates a test-mode online card transaction — no real
// payment processor is contacted. See paymentService.payBookingWithTestCard
// for the simulated decline rule (card ending in "0000").

import { NextRequest } from "next/server";
import { requireRole } from "@/lib/rbac";
import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { payBookingWithTestCard } from "@/services/paymentService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const user = await requireRole("customer");
    const { bookingId } = await params;

    const body = await request.json().catch(() => ({}));
    const { cardNumber, expiry, cvv, cardholderName } = body as {
      cardNumber?: string;
      expiry?: string;
      cvv?: string;
      cardholderName?: string;
    };

    if (!cardNumber || !expiry || !cvv || !cardholderName) {
      throw new AppError("All card fields are required", 422);
    }

    const payment = await payBookingWithTestCard(bookingId, user.id, {
      cardNumber,
      expiry,
      cvv,
      cardholderName,
    });

    return successResponse(payment);
  } catch (error) {
    return errorResponse(error);
  }
}
