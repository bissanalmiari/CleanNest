import { getCurrentUser } from "@/lib/auth";
import { successResponse } from "@/lib/apiResponse";
import { errorResponse } from "@/lib/apiError";

/** Returns the currently-logged-in user based on the session cookie, or null. */
export async function GET() {
  try {
    const user = await getCurrentUser();
    return successResponse({ user });
  } catch (error) {
    return errorResponse(error);
  }
}
