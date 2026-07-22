import { clearAuthCookie } from "@/lib/auth";
import { messageResponse } from "@/lib/apiResponse";
import { errorResponse } from "@/lib/apiError";

export async function POST() {
  try {
    await clearAuthCookie();
    return messageResponse("Logged out successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
