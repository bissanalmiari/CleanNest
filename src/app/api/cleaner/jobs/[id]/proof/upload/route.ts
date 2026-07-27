import { NextRequest } from "next/server";

import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { requireRole } from "@/lib/auth";
import { uploadServiceProofImageToSupabase } from "@/lib/supabase";
import {
  addProofPhoto,
  getOrCreateServiceProof,
} from "@/services/serviceProofService";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const cleaner = await requireRole("cleaner");
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("file");
    const stage = formData.get("stage");

    if (!(file instanceof File)) throw new AppError("No image was provided", 400);
    if (stage !== "before" && stage !== "after") {
      throw new AppError("Photo stage must be before or after", 422);
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new AppError("Only JPEG, PNG, or WEBP images are allowed", 422);
    }
    if (file.size > MAX_SIZE) {
      throw new AppError("Image must be smaller than 5MB", 422);
    }

    const proof = await getOrCreateServiceProof(cleaner.id, id);
    const photoCount =
      stage === "before" ? proof.beforePhotos.length : proof.afterPhotos.length;
    if (photoCount >= 5) {
      throw new AppError(`A maximum of 5 ${stage} photos is allowed`, 409);
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await uploadServiceProofImageToSupabase(
      id,
      cleaner.id,
      stage,
      buffer,
      file.type,
    );
    return successResponse(
      await addProofPhoto(cleaner.id, id, stage, url),
      201,
    );
  } catch (error) {
    return errorResponse(error);
  }
}
