import { Types } from "mongoose";

import {
  AppError,
  errorResponse,
} from "@/lib/apiError";

import { successResponse } from "@/lib/apiResponse";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import AddonModel from "@/models/AddOn";
import ServiceAddonModel from "@/models/ServiceAddOn";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    serviceId: string;
  }>;
}

interface ServiceAddonRecord {
  _id: unknown;
  serviceId: unknown;
  addonId: unknown;

  overridePrice?: unknown;
  overrideDurationMinutes?: unknown;
  maxQuantity?: unknown;

  sortOrder?: unknown;
  isActive?: unknown;
}

interface AddonRecord {
  _id: unknown;

  name?: unknown;
  description?: unknown;

  price?: unknown;
  extraDurationMinutes?: unknown;
  maxQuantity?: unknown;

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

function hasDefinedValue(
  value: unknown,
): boolean {
  return (
    value !== undefined &&
    value !== null
  );
}

/*
 * GET /api/customer/services/[serviceId]/add-ons
 *
 * Returns active add-ons connected to the selected
 * cleaning service.
 */
export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const currentUser =
      await requireUser();

    if (
      currentUser.role !== "customer"
    ) {
      throw new AppError(
        "Only customers can view service add-ons.",
        403,
      );
    }

    const { serviceId } =
      await context.params;

    if (
      !Types.ObjectId.isValid(
        serviceId,
      )
    ) {
      throw new AppError(
        "The selected service ID is invalid.",
        422,
      );
    }

    await connectDB();

    const serviceObjectId =
      new Types.ObjectId(
        serviceId,
      );

    /*
     * Load only active links for this service.
     */
    const mappingDocuments =
      (await ServiceAddonModel.find({
        serviceId:
          serviceObjectId,

        isActive: true,
      })
        .sort({
          sortOrder: 1,
          createdAt: 1,
        })
        .lean()
        .exec()) as unknown as ServiceAddonRecord[];

    if (
      mappingDocuments.length === 0
    ) {
      return successResponse({
        addOns: [],
        total: 0,
      });
    }

    /*
     * The real field in ServiceAddOn is "addonId",
     * not "addOnId".
     */
    const addonIds =
      mappingDocuments
        .map((mapping) =>
          objectIdToString(
            mapping.addonId,
          ),
        )
        .filter((addonId) =>
          Types.ObjectId.isValid(
            addonId,
          ),
        );

    if (addonIds.length === 0) {
      return successResponse({
        addOns: [],
        total: 0,
      });
    }

    const addonObjectIds =
      addonIds.map(
        (addonId) =>
          new Types.ObjectId(
            addonId,
          ),
      );

    const addonDocuments =
      (await AddonModel.find({
        _id: {
          $in: addonObjectIds,
        },

        isActive: true,
      })
        .lean()
        .exec()) as unknown as AddonRecord[];

    const addonsById = new Map<
      string,
      AddonRecord
    >(
      addonDocuments.map(
        (addon) => [
          objectIdToString(
            addon._id,
          ),
          addon,
        ],
      ),
    );

    const addOns =
      mappingDocuments
        .map((mapping) => {
          const addonId =
            objectIdToString(
              mapping.addonId,
            );

          const addon =
            addonsById.get(
              addonId,
            );

          if (!addon) {
            return null;
          }

          const name =
            readString(
              addon.name,
            ) ||
            "Extra cleaning touch";

          const description =
            readString(
              addon.description,
            ) ||
            "Additional focused care for your cleaning route.";

          /*
           * Use the service-specific override when present.
           * Otherwise use the original Addon.price.
           */
          const unitPrice =
            hasDefinedValue(
              mapping.overridePrice,
            )
              ? readNumber(
                  mapping.overridePrice,
                )
              : readNumber(
                  addon.price,
                );

          /*
           * Use the service-specific duration override when
           * present. Otherwise use Addon.extraDurationMinutes.
           */
          const durationMinutes =
            hasDefinedValue(
              mapping.overrideDurationMinutes,
            )
              ? readNumber(
                  mapping.overrideDurationMinutes,
                )
              : readNumber(
                  addon.extraDurationMinutes,
                );

          /*
           * Use the service-specific quantity limit when
           * present. Otherwise use Addon.maxQuantity.
           */
          const maximumQuantity =
            hasDefinedValue(
              mapping.maxQuantity,
            )
              ? readNumber(
                  mapping.maxQuantity,
                  1,
                )
              : readNumber(
                  addon.maxQuantity,
                  1,
                );

          const maxQuantity =
            Math.max(
              1,
              Math.min(
                50,
                Math.floor(
                  maximumQuantity,
                ),
              ),
            );

          return {
            id: addonId,
            name,
            description,

            unitPrice:
              Math.max(
                0,
                unitPrice,
              ),

            durationMinutes:
              Math.max(
                0,
                Math.round(
                  durationMinutes,
                ),
              ),

            maxQuantity,

            /*
             * The current AddOn model has no category or
             * badge field, so the frontend will generate
             * a visual label from the add-on name.
             */
            badge: null,
          };
        })
        .filter(
          (
            addOn,
          ): addOn is NonNullable<
            typeof addOn
          > => addOn !== null,
        );

    return successResponse({
      addOns,
      total: addOns.length,
    });
  } catch (error) {
    return errorResponse(error);
  }
}