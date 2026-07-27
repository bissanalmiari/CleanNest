import { NextRequest } from "next/server";

import { requireUser } from "@/lib/auth";
import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";

import { createBookingSchema } from "@/validators/bookingValidator";

import { createCustomerBooking } from "@/services/bookingCreationService";

function formatValidationErrors(
  issues: {
    path: PropertyKey[];
    message: string;
  }[]
) {
  return issues
    .map((issue) => {
      const field = issue.path.length > 0 ? issue.path.join(".") : "booking";

      return `${field}: ${issue.message}`;
    })
    .join(" ");
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireUser();

    if (currentUser.role !== "customer") {
      throw new AppError("Only customers can create bookings from this endpoint.", 403);
    }

    let requestBody: unknown;

    try {
      requestBody = await request.json();
    } catch {
      throw new AppError("The request body must contain valid JSON.", 400);
    }

    const validationResult = createBookingSchema.safeParse(requestBody);

    if (!validationResult.success) {
      throw new AppError(formatValidationErrors(validationResult.error.issues), 422);
    }

    const result = await createCustomerBooking({
      customerId: currentUser.id,

      input: validationResult.data,
    });

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
