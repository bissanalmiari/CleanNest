import { NextRequest } from "next/server";

import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";

import { bookingPricePreviewSchema } from "@/validators/bookingValidator";

import { BookingPricingError, calculateBookingPrice } from "@/services/bookingPriceService";

function formatValidationErrors(
  issues: Array<{
    path: PropertyKey[];
    message: string;
  }>
) {
  return issues
    .map((issue) => {
      const field = issue.path.length > 0 ? issue.path.join(".") : "booking";

      return `${field}: ${issue.message}`;
    })
    .join(" ");
}

/*
 * POST /api/customer/bookings/price-preview
 *
 * Generates a trusted booking-price preview without
 * creating a booking.
 *
 * The frontend sends selections only. All prices and
 * durations are loaded from MongoDB.
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireUser();

    if (currentUser.role !== "customer") {
      throw new AppError(
        "Only customers can request a booking price preview from this endpoint.",
        403
      );
    }

    let requestBody: unknown;

    try {
      requestBody = await request.json();
    } catch {
      throw new AppError("The request body must contain valid JSON.", 400);
    }

    const validationResult = bookingPricePreviewSchema.safeParse(requestBody);

    if (!validationResult.success) {
      throw new AppError(formatValidationErrors(validationResult.error.issues), 422);
    }

    await connectDB();

    try {
      const quote = await calculateBookingPrice(validationResult.data, {
        customerId: currentUser.id,
      });

      return successResponse({
        quote,
      });
    } catch (error) {
      /*
       * Convert pricing-service errors into the
       * project's standard API error response.
       */
      if (error instanceof BookingPricingError) {
        throw new AppError(error.message, error.statusCode);
      }

      throw error;
    }
  } catch (error) {
    return errorResponse(error);
  }
}
