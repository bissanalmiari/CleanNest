import { Types } from "mongoose";

import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import {
  AppError,
  errorResponse,
} from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";

import BookingModel from "@/models/Booking";
import AddressModel from "@/models/Address";
import ServiceModel from "@/models/Service";

export const runtime = "nodejs";

interface ServiceSummary {
  id: string;
  name: string;
}

interface AddressSummary {
  id: string;
  label: string;
  city: string;
  area: string;
  street: string;
}

function formatDateInBeirut(
  date: Date,
) {
  const formatter =
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Beirut",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  const parts =
    formatter.formatToParts(date);

  const year = parts.find(
    (part) => part.type === "year",
  )?.value;

  const month = parts.find(
    (part) => part.type === "month",
  )?.value;

  const day = parts.find(
    (part) => part.type === "day",
  )?.value;

  if (!year || !month || !day) {
    return date.toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

/*
 * GET /api/customer/bookings
 *
 * Returns every booking belonging to the currently
 * logged-in customer.
 */
export async function GET() {
  try {
    const currentUser =
      await requireUser();

    if (
      currentUser.role !== "customer"
    ) {
      throw new AppError(
        "Only customers can view bookings from this endpoint.",
        403,
      );
    }

    await connectDB();

    if (
      !Types.ObjectId.isValid(
        currentUser.id,
      )
    ) {
      throw new AppError(
        "The current customer ID is invalid.",
        422,
      );
    }

    const customerObjectId =
      new Types.ObjectId(
        currentUser.id,
      );

    const bookingDocuments =
      await BookingModel.find({
        customerId:
          customerObjectId,
      })
        .sort({
          bookingDate: -1,
          createdAt: -1,
        })
        .lean()
        .exec();

    const serviceIds = [
      ...new Set(
        bookingDocuments.map(
          (booking) =>
            booking.serviceId.toString(),
        ),
      ),
    ].map(
      (serviceId) =>
        new Types.ObjectId(serviceId),
    );

    const addressIds = [
      ...new Set(
        bookingDocuments.map(
          (booking) =>
            booking.addressId.toString(),
        ),
      ),
    ].map(
      (addressId) =>
        new Types.ObjectId(addressId),
    );

    const [
      serviceDocuments,
      addressDocuments,
    ] = await Promise.all([
      ServiceModel.find({
        _id: {
          $in: serviceIds,
        },
      })
        .select("_id name")
        .lean()
        .exec(),

      AddressModel.find({
        _id: {
          $in: addressIds,
        },
      })
        .select(
          "_id label city area street",
        )
        .lean()
        .exec(),
    ]);

    const servicesById =
      new Map<
        string,
        ServiceSummary
      >(
        serviceDocuments.map(
          (service) => [
            service._id.toString(),
            {
              id:
                service._id.toString(),
              name: service.name,
            },
          ],
        ),
      );

    const addressesById =
      new Map<
        string,
        AddressSummary
      >(
        addressDocuments.map(
          (address) => [
            address._id.toString(),
            {
              id:
                address._id.toString(),

              label:
                address.label,

              city:
                address.city,

              area:
                address.area,

              street:
                address.street,
            },
          ],
        ),
      );

    const bookings =
      bookingDocuments.map(
        (booking) => {
          const service =
            servicesById.get(
              booking.serviceId.toString(),
            );

          const address =
            addressesById.get(
              booking.addressId.toString(),
            );

          return {
            id:
              booking._id.toString(),

            bookingNumber:
              booking.bookingNumber,

            status:
              booking.status,

            frequency:
              booking.frequency,

            bookingDate:
              formatDateInBeirut(
                new Date(
                  booking.bookingDate,
                ),
              ),

            startTime:
              booking.startTime,

            endTime:
              booking.endTime,

            estimatedDurationMinutes:
              booking.estimatedDurationMinutes ??
              0,

            propertyType:
              booking.propertyType,

            bedrooms:
              booking.bedrooms ??
              null,

            bathrooms:
              booking.bathrooms ??
              null,

            propertySize:
              booking.propertySize ??
              null,

            baseAmount:
              booking.baseAmount,

            addOnsAmount:
              booking.addOnsAmount,

            serviceAreaFee:
              booking.serviceAreaFee,

            discountAmount:
              booking.discountAmount,

            totalAmount:
              booking.totalAmount,

            paymentMethod:
              booking.paymentMethod,

            paymentStatus:
              booking.paymentStatus,

            assignedCleanerName:
              booking.assignedCleanerName ??
              null,

            customerNotes:
              booking.customerNotes ??
              null,

            cancellationReason:
              booking.cancellationReason ??
              null,

            service: service
              ? {
                  id: service.id,
                  name: service.name,
                }
              : null,

            serviceName:
              service?.name ??
              "Cleaning service",

            address: address
              ? {
                  id: address.id,
                  label:
                    address.label,
                  city:
                    address.city,
                  area:
                    address.area,
                  street:
                    address.street,
                }
              : null,

            addressLabel:
              address
                ? [
                    address.label,
                    address.area,
                    address.city,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : "Address unavailable",

            createdAt:
              booking.createdAt instanceof
              Date
                ? booking.createdAt.toISOString()
                : String(
                    booking.createdAt,
                  ),

            updatedAt:
              booking.updatedAt instanceof
              Date
                ? booking.updatedAt.toISOString()
                : String(
                    booking.updatedAt,
                  ),
          };
        },
      );

    return successResponse({
      bookings,
      total: bookings.length,
    });
  } catch (error) {
    return errorResponse(error);
  }
}