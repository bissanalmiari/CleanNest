// GET /api/profile  -> retrieve the logged-in user's profile
// PUT /api/profile  -> update name / phone
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { updateProfileSchema } from "@/validators/userValidator";
import { getUserProfile, updateUserProfile } from "@/services/userService";
import { successResponse } from "@/lib/apiResponse";
import { errorResponse } from "@/lib/apiError";

export async function GET() {
  try {
    const currentUser = await requireUser();
    const profile = await getUserProfile(currentUser.id);
    return successResponse({ user: profile });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const currentUser = await requireUser();
    const body = await req.json();
    const input = updateProfileSchema.parse(body);

    const profile = await updateUserProfile(currentUser.id, input);
    return successResponse({ user: profile });
  } catch (error) {
    return errorResponse(error);
  }
}
