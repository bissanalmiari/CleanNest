// GET  /api/reviews?bookingId=&customerId=&cleanerId=&page=&limit=  -> list reviews
// POST /api/reviews                                                -> create a review
import { NextRequest } from "next/server";
import { requireUser, getCurrentUser } from "@/lib/auth";
import { createReviewSchema, listReviewsQuerySchema } from "@/validators/reviewValidator";
import { createReview, listReviews } from "@/services/reviewService";
import { successResponse } from "@/lib/apiResponse";
import { errorResponse } from "@/lib/apiError";

export async function GET(req: NextRequest) {
  try {
    const query = listReviewsQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));

    // Anyone can browse reviews (they're social proof), but only an admin
    // gets to see ones that have been hidden.
    const currentUser = await getCurrentUser();
    const includeHidden = currentUser?.role === "admin";
    const includePrivate =
      currentUser?.role === "admin" || Boolean(currentUser && query.customerId === currentUser.id);

    const result = await listReviews(query, includeHidden, includePrivate);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireUser();
    const body = await req.json();
    const input = createReviewSchema.parse(body);

    const review = await createReview(currentUser.id, input);
    return successResponse({ review }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
