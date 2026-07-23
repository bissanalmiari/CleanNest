import { Types } from "mongoose";

import {
  AppError,
  errorResponse,
} from "@/lib/apiError";

import { successResponse } from "@/lib/apiResponse";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import AddressModel from "@/models/Address";
import ServiceAreaModel from "@/models/ServiceArea";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AddressRecord {
  _id: unknown;
  serviceAreaId?: unknown;

  label?: unknown;
  city?: unknown;
  area?: unknown;
  street?: unknown;

  building?: unknown;
  floor?: unknown;
  apartment?: unknown;
  postalCode?: unknown;
  landmark?: unknown;
  accessInstructions?: unknown;
  contactPhone?: unknown;

  isDefault?: unknown;
  isActive?: unknown;
}

interface ServiceAreaRecord {
  _id: unknown;

  city?: unknown;
  area?: unknown;
  postalCode?: unknown;

  serviceFee?: unknown;
  maximumConcurrentBookings?: unknown;

  isActive?: unknown;
}

function readString(
  value: unknown,
  fallback = "",
): string {
  return typeof value === "string"
    ? value.trim()
    : fallback;
}

function readNumber(
  value: unknown,
  fallback = 0,
): number {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue)
    ? parsedValue
    : fallback;
}

function objectIdToString(
  value: unknown,
): string {
  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toString" in value &&
    typeof value.toString === "function"
  ) {
    return value.toString();
  }

  return "";
}

function createLocationKey(
  city: unknown,
  area: unknown,
): string {
  return `${readString(city).toLowerCase()}::${readString(
    area,
  ).toLowerCase()}`;
}

function createFullAddress(
  address: AddressRecord,
): string {
  const building = readString(
    address.building,
  );

  const floor = readString(
    address.floor,
  );

  const apartment = readString(
    address.apartment,
  );

  return [
    readString(address.street),

    building
      ? `Building ${building}`
      : "",

    floor
      ? `Floor ${floor}`
      : "",

    apartment
      ? `Apartment ${apartment}`
      : "",

    readString(address.area),
    readString(address.city),
  ]
    .filter(Boolean)
    .join(", ");
}

/*
 * GET /api/customer/booking-addresses
 *
 * Returns the current customer's active saved addresses
 * with their matching active CleanNest service areas.
 */
export async function GET() {
  try {
    const currentUser =
      await requireUser();

    if (
      currentUser.role !== "customer"
    ) {
      throw new AppError(
        "Only customers can view booking addresses.",
        403,
      );
    }

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

    await connectDB();

    const customerObjectId =
      new Types.ObjectId(
        currentUser.id,
      );

    const [
      addressDocuments,
      serviceAreaDocuments,
    ] = await Promise.all([
      AddressModel.find({
        customerId:
          customerObjectId,

        isActive: true,
      })
        .sort({
          isDefault: -1,
          createdAt: -1,
        })
        .lean()
        .exec(),

      ServiceAreaModel.find({
        isActive: true,
      })
        .sort({
          city: 1,
          area: 1,
        })
        .lean()
        .exec(),
    ]);

    const addresses =
      addressDocuments as unknown as AddressRecord[];

    const serviceAreas =
      serviceAreaDocuments as unknown as ServiceAreaRecord[];

    const serviceAreasById =
      new Map<
        string,
        ServiceAreaRecord
      >();

    const serviceAreasByLocation =
      new Map<
        string,
        ServiceAreaRecord
      >();

    for (
      const serviceArea of serviceAreas
    ) {
      const serviceAreaId =
        objectIdToString(
          serviceArea._id,
        );

      if (serviceAreaId) {
        serviceAreasById.set(
          serviceAreaId,
          serviceArea,
        );
      }

      serviceAreasByLocation.set(
        createLocationKey(
          serviceArea.city,
          serviceArea.area,
        ),
        serviceArea,
      );
    }

    const bookingAddresses =
      addresses.map((address) => {
        const storedServiceAreaId =
          objectIdToString(
            address.serviceAreaId,
          );

        /*
         * Prefer the address's stored serviceAreaId.
         * Older addresses without it fall back to city + area.
         */
        const serviceArea =
          serviceAreasById.get(
            storedServiceAreaId,
          ) ??
          serviceAreasByLocation.get(
            createLocationKey(
              address.city,
              address.area,
            ),
          ) ??
          null;

        const serviceAreaId =
          serviceArea
            ? objectIdToString(
                serviceArea._id,
              )
            : "";

        const city =
          readString(address.city);

        const area =
          readString(address.area);

        return {
          id:
            objectIdToString(
              address._id,
            ),

          label:
            readString(
              address.label,
              "Saved address",
            ),

          city,
          area,

          street:
            readString(
              address.street,
            ),

          building:
            readString(
              address.building,
            ),

          floor:
            readString(
              address.floor,
            ),

          apartment:
            readString(
              address.apartment,
            ),

          postalCode:
            readString(
              address.postalCode,
            ),

          landmark:
            readString(
              address.landmark,
            ),

          accessInstructions:
            readString(
              address.accessInstructions,
            ),

          contactPhone:
            readString(
              address.contactPhone,
            ),

          fullAddress:
            createFullAddress(
              address,
            ),

          isDefault:
            address.isDefault === true,

          isServiceable:
            Boolean(serviceArea),

          serviceAreaId,

          serviceAreaLabel:
            serviceArea
              ? `${readString(
                  serviceArea.area,
                )}, ${readString(
                  serviceArea.city,
                )}`
              : `${area}, ${city}`,

          serviceFee:
            serviceArea
              ? Math.max(
                  0,
                  readNumber(
                    serviceArea.serviceFee,
                  ),
                )
              : 0,

          maximumConcurrentBookings:
            serviceArea
              ? Math.max(
                  1,
                  readNumber(
                    serviceArea.maximumConcurrentBookings,
                    1,
                  ),
                )
              : 0,
        };
      });

    return successResponse({
      addresses:
        bookingAddresses,

      total:
        bookingAddresses.length,

      serviceableTotal:
        bookingAddresses.filter(
          (address) =>
            address.isServiceable,
        ).length,
    });
  } catch (error) {
    return errorResponse(error);
  }
}