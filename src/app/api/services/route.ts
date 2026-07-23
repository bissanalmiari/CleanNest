import {
  NextRequest,
  NextResponse,
} from "next/server";

import getServices from "@/services/serviceService";

export const dynamic = "force-dynamic";

type ServiceSort =
  | "newest"
  | "oldest"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc";

const allowedSortOptions = new Set<ServiceSort>([
  "newest",
  "oldest",
  "price-asc",
  "price-desc",
  "name-asc",
  "name-desc",
]);

function parsePositiveInteger(
  value: string | null,
  fallbackValue: number,
) {
  if (value === null || value.trim() === "") {
    return fallbackValue;
  }

  const parsedValue = Number(value);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < 1
  ) {
    return null;
  }

  return parsedValue;
}

function parseOptionalPrice(value: string | null) {
  if (value === null || value.trim() === "") {
    return undefined;
  }

  const parsedValue = Number(value);

  if (
    !Number.isFinite(parsedValue) ||
    parsedValue < 0
  ) {
    return null;
  }

  return parsedValue;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams =
      request.nextUrl.searchParams;

    const search =
      searchParams.get("search")?.trim() ?? "";

    const category =
      searchParams.get("category")?.trim() ?? "";

    const sortValue =
      searchParams.get("sort")?.trim() ??
      "newest";

    const page = parsePositiveInteger(
      searchParams.get("page"),
      1,
    );

    const limit = parsePositiveInteger(
      searchParams.get("limit"),
      9,
    );

    const minPrice = parseOptionalPrice(
      searchParams.get("minPrice"),
    );

    const maxPrice = parseOptionalPrice(
      searchParams.get("maxPrice"),
    );

    if (search.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Search cannot exceed 100 characters.",
        },
        {
          status: 400,
        },
      );
    }

    if (category.length > 80) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Category cannot exceed 80 characters.",
        },
        {
          status: 400,
        },
      );
    }

    if (page === null) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Page must be a positive integer.",
        },
        {
          status: 400,
        },
      );
    }

    if (limit === null) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Limit must be a positive integer.",
        },
        {
          status: 400,
        },
      );
    }

    if (minPrice === null) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Minimum price must be a non-negative number.",
        },
        {
          status: 400,
        },
      );
    }

    if (maxPrice === null) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Maximum price must be a non-negative number.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Minimum price cannot be greater than maximum price.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !allowedSortOptions.has(
        sortValue as ServiceSort,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid sorting option.",
          allowedSortOptions: Array.from(
            allowedSortOptions,
          ),
        },
        {
          status: 400,
        },
      );
    }

    const result = await getServices({
      search: search || undefined,
      category: category || undefined,
      minPrice,
      maxPrice,
      sort: sortValue as ServiceSort,
      page,
      limit,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Services retrieved successfully.",
        data: result,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown server error";

    console.error("GET /api/services error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve services.",
        error: errorMessage,
      },
      {
        status: 500,
      },
    );
  }
}