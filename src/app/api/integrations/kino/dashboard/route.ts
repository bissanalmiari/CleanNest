import { NextRequest } from "next/server";

import {
  getDashboardOverview,
  type RevenueRange,
} from "@/services/dashboardService";

/* =========================================================
   KINO INTEGRATION AUTHENTICATION
========================================================= */

function authorizeKino(
  request: NextRequest
) {
  const configuredSecret =
    process.env.KINO_INTEGRATION_SECRET;

  if (!configuredSecret) {
    throw new Error(
      "KINO_INTEGRATION_SECRET is not configured."
    );
  }

  const authorization =
    request.headers.get(
      "authorization"
    );

  const expected =
    `Bearer ${configuredSecret}`;

  if (authorization !== expected) {
    return false;
  }

  return true;
}

/* =========================================================
   GET /api/integrations/kino/dashboard

   This endpoint is NOT authenticated using a CleanNest
   user/admin browser session.

   It uses a dedicated server-to-server integration secret.

   KINO can READ dashboard information through this route.

   It cannot change CleanNest data.
========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    /* -----------------------------------------------------
       CHECK KINO INTEGRATION SECRET
    ----------------------------------------------------- */

    const authorized =
      authorizeKino(request);

    if (!authorized) {
      return Response.json(
        {
          success: false,
          error:
            "Unauthorized KINO integration request.",
        },
        {
          status: 401,
        }
      );
    }

    /* -----------------------------------------------------
       READ QUERY PARAMETERS
    ----------------------------------------------------- */

    const { searchParams } =
      new URL(request.url);

    const range =
      (searchParams.get(
        "range"
      ) as RevenueRange) ||
      "week";

    if (
      ![
        "week",
        "month",
        "year",
      ].includes(range)
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Invalid range. Use week, month, or year.",
        },
        {
          status: 422,
        }
      );
    }

    /* -----------------------------------------------------
       USE THE REAL CLEANNEST SERVICE

       We reuse the exact same dashboard service that your
       normal admin API already uses.

       No duplicated business logic.
    ----------------------------------------------------- */

    const overview =
      await getDashboardOverview({
        range,

        reportFilters: {
          page: 1,
          limit: 20,
        },
      });

    /* -----------------------------------------------------
       RETURN REAL CLEANNEST DATA
    ----------------------------------------------------- */

    return Response.json({
      success: true,

      integration:
        "cleannest",

      resource:
        "dashboard",

      range,

      generatedAt:
        new Date().toISOString(),

      data:
        overview,
    });
  } catch (error) {
    console.error(
      "CleanNest KINO integration error:",
      error
    );

    return Response.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to retrieve CleanNest dashboard information.",
      },
      {
        status: 500,
      }
    );
  }
}