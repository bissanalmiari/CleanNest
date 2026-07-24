import {
  AppError,
  errorResponse,
} from "@/lib/apiError";

import {
  successResponse,
} from "@/lib/apiResponse";

import {
  requireUser,
} from "@/lib/auth";

import {
  connectDB,
} from "@/lib/db";

import ServiceModel from "@/models/Service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RawServiceDocument {
  _id: {
    toString(): string;
  };

  name?: unknown;
  title?: unknown;

  description?: unknown;
  shortDescription?: unknown;

  basePrice?: unknown;
  price?: unknown;
  startingPrice?: unknown;

  estimatedDurationMinutes?: unknown;
  durationMinutes?: unknown;
  baseDurationMinutes?: unknown;
  duration?: unknown;

  badge?: unknown;
  category?: unknown;
  slug?: unknown;

  features?: unknown;
  includedTasks?: unknown;

  isActive?: unknown;
  active?: unknown;
  status?: unknown;

  sortOrder?: unknown;
  createdAt?: unknown;
}

function readString(
  value: unknown,
  fallback = "",
): string {
  if (
    typeof value !== "string"
  ) {
    return fallback;
  }

  return value.trim();
}

function readNumber(
  value: unknown,
  fallback = 0,
): number {
  const parsedValue =
    Number(value);

  return Number.isFinite(
    parsedValue,
  )
    ? parsedValue
    : fallback;
}

function readFeatures(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((feature) => {
      if (
        typeof feature ===
        "string"
      ) {
        return feature.trim();
      }

      if (
        typeof feature ===
          "object" &&
        feature !== null
      ) {
        const featureRecord =
          feature as Record<
            string,
            unknown
          >;

        return (
          readString(
            featureRecord.name,
          ) ||
          readString(
            featureRecord.label,
          ) ||
          readString(
            featureRecord.title,
          ) ||
          readString(
            featureRecord.description,
          )
        );
      }

      return "";
    })
    .filter(Boolean)
    .slice(0, 5);
}

function createSlug(
  value: string,
): string {
  return value
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    );
}

function isServiceActive(
  service: RawServiceDocument,
): boolean {
  if (
    service.isActive === false ||
    service.active === false
  ) {
    return false;
  }

  const status =
    readString(
      service.status,
    ).toLowerCase();

  return ![
    "inactive",
    "disabled",
    "archived",
    "deleted",
  ].includes(status);
}

/*
 * GET /api/customer/services
 *
 * Returns the cleaning services that are currently
 * available to authenticated customers.
 */
export async function GET() {
  try {
    const currentUser =
      await requireUser();

    if (
      currentUser.role !==
      "customer"
    ) {
      throw new AppError(
        "Only customers can view cleaning services.",
        403,
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
        .exec()) as unknown as RawServiceDocument[];

    const services =
      serviceDocuments
        .filter(isServiceActive)
        .map((service) => {
          const name =
            readString(
              service.name,
            ) ||
            readString(
              service.title,
            ) ||
            "Cleaning service";

          const description =
            readString(
              service.description,
            ) ||
            readString(
              service.shortDescription,
            ) ||
            "A professional CleanNest cleaning service designed for your property.";

          const basePrice =
            readNumber(
              service.basePrice ??
                service.price ??
                service.startingPrice,
            );

          const estimatedDurationMinutes =
            readNumber(
              service.estimatedDurationMinutes ??
                service.durationMinutes ??
                service.baseDurationMinutes ??
                service.duration,
            );

          const badge =
            readString(
              service.badge,
            ) ||
            readString(
              service.category,
            ) ||
            null;

          const storedSlug =
            readString(
              service.slug,
            );

          const features =
            readFeatures(
              service.features,
            );

          const includedTasks =
            readFeatures(
              service.includedTasks,
            );

          return {
            id:
              service._id.toString(),

            name,
            description,

            basePrice,
            estimatedDurationMinutes,

            badge,

            slug:
              storedSlug ||
              createSlug(name),

            features:
              features.length > 0
                ? features
                : includedTasks,
          };
        });

    return successResponse({
      services,
      total: services.length,
    });
  } catch (error) {
    return errorResponse(error);
  }
}