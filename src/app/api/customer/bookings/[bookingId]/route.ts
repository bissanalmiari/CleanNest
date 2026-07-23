import { NextRequest } from "next/server";

import { requireUser } from "@/lib/auth";
import {
  AppError,
  errorResponse,
} from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";

import {
  bookingIdParamsSchema,
  editBookingSchema,
} from "@/validators/bookingValidator";

import { editCustomerBooking } from "@/services/bookingEditService";

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
 * PATCH /api/customer/bookings/[bookingId]
 *
 * Allows the logged-in customer to update editable
 * booking details without changing the booking date
 * or start time.
 *
 * Scheduling changes are handled separately by the
 * reschedule endpoint.
 */
export async function PATCH(
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
        "Only customers can edit bookings from this endpoint.",
        403,
      );
    }

    /*
     * Validate the dynamic booking ID.
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
     * Only fields allowed by editBookingSchema
     * can reach the booking edit service.
     */
    const bodyValidation =
      editBookingSchema.safeParse(
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
      await editCustomerBooking({
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