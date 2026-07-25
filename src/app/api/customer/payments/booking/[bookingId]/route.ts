// src/app/api/customer/payments/booking/[bookingId]/route.ts
// GET /api/customer/payments/booking/:bookingId
// Customer-only. Fetches (creating if needed) the payment record tied to
// one of the caller's own bookings — used to render the "Pay now" page.

import { requireRole } from "@/lib/rbac";
import { errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { getPaymentForBookingAsCustomer } from "@/services/paymentService";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const user = await requireRole("customer");
    const { bookingId } = await params;

    const result = await getPaymentForBookingAsCustomer(bookingId, user.id);

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
