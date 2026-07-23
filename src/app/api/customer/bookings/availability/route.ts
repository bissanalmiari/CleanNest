import { NextRequest } from "next/server";

import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import {
  AppError,
  errorResponse,
} from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";

import BookingModel from "@/models/Booking";
import ServiceModel from "@/models/Service";
import ServiceAreaModel from "@/models/ServiceArea";

import {
  availabilityQuerySchema,
} from "@/validators/bookingValidator";

import {
  BookingAvailabilityError,
  checkBookingAvailability,
} from "@/services/bookingAvailabilityService";

function formatValidationErrors(
  issues: Array<{
    path: PropertyKey[];
    message: string;
  }>,
) {
  return issues
    .map((issue) => {
      const field =
        issue.path.length > 0
          ? issue.path.join(".")
          : "availability";

      return `${field}: ${issue.message}`;
    })
    .join(" ");
}

/*
 * POST /api/customer/bookings/availability
 *
 * Checks whether a selected booking period is available.
 *
 * The detailed conflicting booking records remain private.
 * The customer only receives the availability result and
 * remaining capacity.
 */
export async function POST(
  request: NextRequest,
) {
  try {
    const currentUser =
      await requireUser();

    if (
      currentUser.role !==
      "customer"
    ) {
      throw new AppError(
        "Only customers can check booking availability from this endpoint.",
        403,
      );
    }

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

    const validationResult =
      availabilityQuerySchema.safeParse(
        requestBody,
      );

    if (!validationResult.success) {
      throw new AppError(
        formatValidationErrors(
          validationResult.error.issues,
        ),
        422,
      );
    }

    const input =
      validationResult.data;

    await connectDB();

    /*
     * Verify that the selected service exists
     * and can currently be booked.
     */
    const service =
      await ServiceModel.findById(
        input.serviceId,
      )
        .select("_id name isActive")
        .lean()
        .exec();

    if (!service) {
      throw new AppError(
        "The selected service could not be found.",
        404,
      );
    }

    if (!service.isActive) {
      throw new AppError(
        "The selected service is currently unavailable.",
        409,
      );
    }

    /*
     * Availability capacity is controlled by the
     * selected service area.
     */
    const serviceArea =
      await ServiceAreaModel.findById(
        input.serviceAreaId,
      )
        .select(
          [
            "_id",
            "city",
            "area",
            "isActive",
            "maximumConcurrentBookings",
          ].join(" "),
        )
        .lean()
        .exec();

    if (
      !serviceArea ||
      !serviceArea.isActive
    ) {
      throw new AppError(
        "The selected service area is unavailable.",
        404,
      );
    }

    /*
     * excludeBookingId is used during rescheduling.
     *
     * A customer may only exclude one of their own
     * bookings. Without this check, someone could pass
     * another customer's booking ID and incorrectly
     * reduce the number of detected conflicts.
     */
    if (input.excludeBookingId) {
      const bookingToExclude =
        await BookingModel.findOne({
          _id:
            input.excludeBookingId,

          customerId:
            currentUser.id,
        })
          .select("_id status")
          .lean()
          .exec();

      if (!bookingToExclude) {
        throw new AppError(
          "The booking being rescheduled could not be found.",
          404,
        );
      }

      if (
        bookingToExclude.status ===
        "cancelled"
      ) {
        throw new AppError(
          "A cancelled booking cannot be rescheduled.",
          409,
        );
      }

      if (
        bookingToExclude.status ===
          "completed" ||
        bookingToExclude.status ===
          "in_progress"
      ) {
        throw new AppError(
          "This booking can no longer be rescheduled.",
          409,
        );
      }
    }

    try {
      const result =
        await checkBookingAvailability(
          input,
          {
            maximumConcurrentBookings:
              serviceArea
                .maximumConcurrentBookings,
          },
        );

      /*
       * Do not expose IDs or booking numbers belonging
       * to other customers. The availability service
       * keeps those details for internal/admin usage.
       */
      return successResponse({
        availability: {
          available:
            result.available,

          reason:
            result.reason,

          message:
            result.message,

          requestedSlot:
            result.requestedSlot,

          capacity: {
            maximumConcurrentBookings:
              result.capacity
                .maximumConcurrentBookings,

            overlappingBookings:
              result.capacity
                .overlappingBookings,

            remainingCapacity:
              result.capacity
                .remainingCapacity,
          },

          blockedPeriod:
            result.conflicts
              .blockedTimes.length > 0,
        },

        service: {
          id:
            service._id.toString(),

          name:
            service.name,
        },

        serviceArea: {
          id:
            serviceArea._id.toString(),

          city:
            serviceArea.city,

          area:
            serviceArea.area,
        },
      });
    } catch (error) {
      if (
        error instanceof
        BookingAvailabilityError
      ) {
        throw new AppError(
          error.message,
          error.statusCode,
        );
      }

      throw error;
    }
  } catch (error) {
    return errorResponse(error);
  }
}