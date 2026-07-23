import { NextRequest } from "next/server";

import { requireUser } from "@/lib/auth";
import {
  AppError,
  errorResponse,
} from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";

import {
  bookingIdParamsSchema,
  rescheduleBookingSchema,
} from "@/validators/bookingValidator";

import { rescheduleCustomerBooking } from "@/services/bookingRescheduleService";

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
 * POST /api/customer/bookings/[bookingId]/reschedule
 *
 * Reschedules a booking belonging to the logged-in
 * customer.
 *
 * The rescheduling service handles:
 * - Customer ownership
 * - Booking status validation
 * - The 24-hour change rule
 * - Future date and time validation
 * - Availability checking
 * - Trusted end-time calculation
 * - Cleaner-name removal
 * - Reschedule history
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
        "Only customers can reschedule bookings from this endpoint.",
        403,
      );
    }

    /*
     * Validate the booking ID received
     * from the dynamic route.
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
     * Parse the request body safely.
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
     * Validate the new booking schedule.
     */
    const bodyValidation =
      rescheduleBookingSchema.safeParse(
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
      await rescheduleCustomerBooking({
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