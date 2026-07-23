import { NextRequest } from "next/server";

import { requireRole } from "@/lib/auth";
import {
  AppError,
  errorResponse,
} from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";

import {
  assignCleanerNameSchema,
  bookingIdParamsSchema,
} from "@/validators/bookingValidator";

import { assignCleanerNameToBooking } from "@/services/bookingCleanerAssignmentService";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    id: string;
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
 * PATCH /api/admin/bookings/[id]/assign-cleaner
 *
 * Allows an administrator to assign, replace, or remove
 * a cleaner name from a pending or confirmed booking.
 *
 * No cleaner user account or cleaner ID is used.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const currentAdmin =
      await requireRole("admin");

    /*
     * Validate the booking ID received from
     * the dynamic route.
     */
    const { id } =
      await context.params;

    const paramsValidation =
      bookingIdParamsSchema.safeParse({
        bookingId: id,
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
     * Validate the cleaner name and optional
     * admin assignment note.
     */
    const bodyValidation =
      assignCleanerNameSchema.safeParse(
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
      await assignCleanerNameToBooking({
        adminId:
          currentAdmin.id,

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
