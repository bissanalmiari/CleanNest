// POST /api/profile/avatar -> upload/replace the logged-in user's profile picture
// Body: multipart/form-data with a single field named "file"
// Storage: Supabase Storage (see src/lib/supabase.ts)
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { AppError } from "@/lib/apiError";
import { avatarFileSchema } from "@/validators/userValidator";
import { updateUserAvatar } from "@/services/userService";
import { uploadAvatarToSupabase } from "@/lib/supabase";
import { successResponse } from "@/lib/apiResponse";
import { errorResponse } from "@/lib/apiError";

export const runtime = "nodejs"; // needs Node Buffers, not the Edge runtime

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireUser();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) throw new AppError("No file provided", 400);

    if (!avatarFileSchema.allowedMimeTypes.includes(file.type)) {
      throw new AppError("Only JPEG, PNG, or WEBP images are allowed", 400);
    }
    if (file.size > avatarFileSchema.maxSizeBytes) {
      throw new AppError("Image must be under 5MB", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await uploadAvatarToSupabase(currentUser.id, buffer, file.type);

    const profile = await updateUserAvatar(currentUser.id, url);
    return successResponse({ user: profile });
  } catch (error) {
    return errorResponse(error);
  }
}
