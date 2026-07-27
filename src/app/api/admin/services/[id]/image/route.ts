import { NextRequest } from "next/server";

import { successResponse } from "@/lib/apiResponse";
import { AppError, errorResponse } from "@/lib/apiError";
import { requireUser } from "@/lib/auth";
import { removeServiceImageFromSupabase, uploadServiceImageToSupabase } from "@/lib/supabase";
import { getServiceById, updateService } from "@/services/serviceManagementService";
import { serviceIdParamSchema } from "@/validators/serviceValidator";

export const runtime = "nodejs";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function hasValidImageSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === "image/png") {
    return (
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    );
  }

  if (mimeType === "image/webp") {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }

  return false;
}

async function requireAdmin() {
  const currentUser = await requireUser();

  if (currentUser.role !== "admin") {
    throw new AppError("Admins only", 403);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();

    const { id } = serviceIdParamSchema.parse(await params);
    await getServiceById(id);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new AppError("No image file was provided.", 400);
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new AppError("Only JPEG, PNG, or WEBP images are allowed.", 400);
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new AppError("The service image must be smaller than 5 MB.", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasValidImageSignature(buffer, file.type)) {
      throw new AppError("The uploaded file is not a valid image.", 400);
    }

    const { url } = await uploadServiceImageToSupabase(id, buffer, file.type);
    const service = await updateService(id, { imageUrl: url });

    return successResponse({ service, imageUrl: url });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = serviceIdParamSchema.parse(await params);
    await getServiceById(id);
    await removeServiceImageFromSupabase(id);
    const service = await updateService(id, { imageUrl: "" });

    return successResponse({ service, imageUrl: "" });
  } catch (error) {
    return errorResponse(error);
  }
}
