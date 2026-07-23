import { errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import ServiceModel from "@/models/Service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RawServiceDocument {
  _id: {
    toString(): string;
  };

  name?: string;
  title?: string;

  description?: string;
  shortDescription?: string;

  basePrice?: number;
  price?: number;
  startingPrice?: number;

  estimatedDurationMinutes?: number;
  durationMinutes?: number;
  baseDurationMinutes?: number;

  badge?: string;
  category?: string;
  slug?: string;

  features?: unknown;

  isActive?: boolean;
  status?: string;

  sortOrder?: number;
  createdAt?: Date;
}

function normalizeNumber(
  value: unknown,
  fallback = 0,
) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : fallback;
}

function normalizeFeatures(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (feature): feature is string =>
        typeof feature === "string",
    )
    .map((feature) => feature.trim())
    .filter(Boolean)
    .slice(0, 5);
}

export async function GET() {
  try {
    const currentUser =
      await requireUser();

    if (
      currentUser.role !== "customer"
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Only customers can view cleaning services.",
        },
        {
          status: 403,
        },
      );
    }

    await connectDB();

    const serviceDocuments =
      (await ServiceModel.find({})
        .sort({
          sortOrder: 1,
          createdAt: 1,
        })
        .lean()
        .exec()) as RawServiceDocument[];

    /*
     * A service remains visible unless it has explicitly
     * been disabled or archived.
     */
    const activeServices =
      serviceDocuments.filter(
        (service) => {
          if (
            service.isActive === false
          ) {
            return false;
          }

          const normalizedStatus =
            service.status
              ?.trim()
              .toLowerCase();

          return ![
            "inactive",
            "disabled",
            "archived",
          ].includes(
            normalizedStatus ?? "",
          );
        },
      );

    const services =
      activeServices.map(
        (service) => {
          const name =
            service.name?.trim() ||
            service.title?.trim() ||
            "Cleaning service";

          const description =
            service.description?.trim() ||
            service.shortDescription?.trim() ||
            "A professional CleanNest cleaning plan designed for your property.";

          const basePrice =
            normalizeNumber(
              service.basePrice ??
                service.price ??
                service.startingPrice,
            );

          const estimatedDurationMinutes =
            normalizeNumber(
              service.estimatedDurationMinutes ??
                service.durationMinutes ??
                service.baseDurationMinutes,
            );

          return {
            id:
              service._id.toString(),

            name,
            description,

            basePrice,
            estimatedDurationMinutes,

            badge:
              service.badge?.trim() ||
              service.category?.trim() ||
              null,

            slug:
              service.slug?.trim() ||
              name
                .toLowerCase()
                .replace(
                  /[^a-z0-9]+/g,
                  "-",
                )
                .replace(
                  /^-+|-+$/g,
                  "",
                ),

            features:
              normalizeFeatures(
                service.features,
              ),
          };
        },
      );

    return successResponse({
      services,
      total: services.length,
    });
  } catch (error) {
    return errorResponse(error);
  }
}