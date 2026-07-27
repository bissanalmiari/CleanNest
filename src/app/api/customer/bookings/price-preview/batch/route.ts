import { NextRequest } from "next/server";

import { successResponse } from "@/lib/apiResponse";
import { AppError, errorResponse } from "@/lib/apiError";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { BookingPricingError, calculateServicePricePreviews } from "@/services/bookingPriceService";
import { bookingBatchPricePreviewSchema } from "@/validators/bookingValidator";

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
 * POST /api/customer/bookings/price-preview/batch
 *
 * Returns personalized catalogue prices for up to 50
 * services with one authenticated request and one service query.
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireUser();

    if (currentUser.role !== "customer") {
      throw new AppError("Only customers can request booking price previews.", 403);
    }

    let requestBody: unknown;

    try {
      requestBody = await request.json();
    } catch {
      throw new AppError("The request body must contain valid JSON.", 400);
    }

    const validationResult = bookingBatchPricePreviewSchema.safeParse(requestBody);

    if (!validationResult.success) {
      throw new AppError(formatValidationErrors(validationResult.error.issues), 422);
    }

    await connectDB();

    try {
      const quotes = await calculateServicePricePreviews(validationResult.data);

      return successResponse({
        quotes,
        total: Object.keys(quotes).length,
      });
    } catch (error) {
      if (error instanceof BookingPricingError) {
        throw new AppError(error.message, error.statusCode);
      }

      throw error;
    }
  } catch (error) {
    return errorResponse(error);
  }
}
