
import { NextRequest } from "next/server";
import { requireUser, requireRole } from "@/lib/auth";
import {
  reviewIdParamSchema,
  updateReviewSchema,
  adminReplySchema,
  updateReviewVisibilitySchema,
} from "@/validators/reviewValidator";
import {
  getReviewById,
  updateReview,
  replyToReview,
  setReviewVisibility,
  deleteReview,
} from "@/services/reviewService";
import { successResponse } from "@/lib/apiResponse";
import { errorResponse } from "@/lib/apiError";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = reviewIdParamSchema.parse(await params);
    const review = await getReviewById(id);
    return successResponse({ review });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = reviewIdParamSchema.parse(await params);
    const body = await req.json();

    // Distinguish the operation by shape, since three different actors
    // (owner / admin / admin) share this one endpoint.
    if ("adminReply" in body) {
      await requireRole("admin");
      const input = adminReplySchema.parse(body);
      const review = await replyToReview(id, input.adminReply);
      return successResponse({ review });
    }

    if ("isVisible" in body) {
      await requireRole("admin");
      const input = updateReviewVisibilitySchema.parse(body);
      const review = await setReviewVisibility(id, input.isVisible);
      return successResponse({ review });
    }

    const currentUser = await requireUser();
    const input = updateReviewSchema.parse(body);
    const review = await updateReview(id, currentUser.id, input);
    return successResponse({ review });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = reviewIdParamSchema.parse(await params);
    const currentUser = await requireUser();
    await deleteReview(id, currentUser.id, currentUser.role);
    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}