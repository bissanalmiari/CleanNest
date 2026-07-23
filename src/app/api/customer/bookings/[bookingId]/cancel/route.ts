import { NextRequest } from "next/server";

import { requireUser } from "@/lib/auth";
import {
  AppError,
  errorResponse,
} from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";

import {
  bookingIdParamsSchema,
  cancelBookingSchema,
} from "@/validators/bookingValidator";

import { cancelCustomerBooking } from "@/services/bookingCancellationService";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    bookingId: string;
  }>;
}

interface ValidationIssue {
  path: PropertyKey[];
  message: string;
}

function formatValidationErrors(
  issues: ValidationIssue[],
) {
  return issues
    .map((issue) => {
      const field =
        issue.path.length > 0
          ? issue.path.join(".")
          : "booking";

      return `${field}: ${issue.message}`;
    })
    .join(" ");
}

/*
 * POST /api/customer/bookings/[bookingId]/cancel
 *
 * Cancels a booking belonging to the logged-in customer.
 *
 * The cancellation service handles:
 * - Booking ownership
 * - Booking status validation
 * - The 24-hour cancellation rule
 * - Payment cancellation or refund
 * - Promo-code usage restoration
 * - Booking status history
 */
export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const currentUser =
      await requireUser();

    if (
      currentUser.role !==
      "customer"
    ) {
      throw new AppError(
        "Only customers can cancel bookings from this endpoint.",
        403,
      );
    }

    /*
     * Validate the booking ID from the route.
     */
    const { bookingId } =
      await context.params;

    const paramsValidation =
      bookingIdParamsSchema.safeParse({
        bookingId,
      });

    if (!paramsValidation.success) {
      throw new AppError(
        formatValidationErrors(
          paramsValidation.error.issues,
        ),
        422,
      );
    }

    /*
     * Parse the cancellation request body.
     */
    let requestBody: unknown;

    try {
      requestBody =
        await request.json();
    } catch {
      throw new AppError(
        "The request body must contain valid JSON.",
        400,
      );
    }

    /*
     * Validate the cancellation reason.
     */
    const bodyValidation =
      cancelBookingSchema.safeParse(
        requestBody,
      );

    if (!bodyValidation.success) {
      throw new AppError(
        formatValidationErrors(
          bodyValidation.error.issues,
        ),
        422,
      );
    }

    const result =
      await cancelCustomerBooking({
        customerId:
          currentUser.id,

        bookingId:
          paramsValidation.data
            .bookingId,

        input:
          bodyValidation.data,
      });

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}