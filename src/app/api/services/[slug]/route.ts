import {
  NextRequest,
  NextResponse,
} from "next/server";

import { getServiceBySlug } from "@/services/serviceService";

export const dynamic = "force-dynamic";

type ServiceDetailsRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  context: ServiceDetailsRouteContext,
) {
  try {
    const { slug } =
      await context.params;

    const normalizedSlug = slug
      .trim()
      .toLowerCase();

    if (!normalizedSlug) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Service slug is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (normalizedSlug.length > 120) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Service slug cannot exceed 120 characters.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
        normalizedSlug,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Service slug is invalid.",
        },
        {
          status: 400,
        },
      );
    }

    const service =
      await getServiceBySlug(
        normalizedSlug,
      );

    if (!service) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Service was not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Service retrieved successfully.",
        data: {
          service,
        },
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown server error.";

    console.error(
      "GET /api/services/[slug] error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to retrieve the service.",
        error:
          process.env.NODE_ENV ===
          "development"
            ? errorMessage
            : undefined,
      },
      {
        status: 500,
      },
    );
  }
}