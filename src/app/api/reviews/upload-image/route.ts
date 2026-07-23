import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { AppError } from "@/lib/apiError";
import {
  reviewImageFileSchema,
  reviewImageSlotSchema,
} from "@/validators/reviewValidator";
import { assertBookingOwnership } from "@/services/reviewService";
import { uploadReviewImageToSupabase } from "@/lib/supabase";
import { successResponse } from "@/lib/apiResponse";
import { errorResponse } from "@/lib/apiError";

export const runtime = "nodejs"; // needs Node Buffers, not the Edge runtime

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireUser();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bookingId = formData.get("bookingId");
    const slotRaw = formData.get("slot");

    if (!file) throw new AppError("No file provided", 400);
    if (typeof bookingId !== "string") throw new AppError("bookingId is required", 400);

    const slot = reviewImageSlotSchema.parse(slotRaw);

    if (!reviewImageFileSchema.allowedMimeTypes.includes(file.type)) {
      throw new AppError("Only JPEG, PNG, or WEBP images are allowed", 400);
    }
    if (file.size > reviewImageFileSchema.maxSizeBytes) {
      throw new AppError("Image must be under 5MB", 400);
    }

    // Confirms this booking belongs to the caller before writing anything —
    // otherwise anyone could upload images "for" someone else's booking id.
    await assertBookingOwnership(bookingId, currentUser.id);

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await uploadReviewImageToSupabase(bookingId, slot, buffer, file.type);

    return successResponse({ url, slot });
  } catch (error) {
    return errorResponse(error);
  }
}
