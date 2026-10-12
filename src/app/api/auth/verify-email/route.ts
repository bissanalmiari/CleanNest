import { NextRequest } from "next/server";
import { verifyEmailSchema } from "@/validators/authValidator";
import { verifyEmailOtp } from "@/services/authService";
import { setAuthCookie } from "@/lib/auth";
import { successResponse } from "@/lib/apiResponse";
import { errorResponse } from "@/lib/apiError";
import { enforceAuthRequestRateLimit } from "@/lib/authRateLimit";

export async function POST(request: NextRequest) {
  try {
    await enforceAuthRequestRateLimit(request, "verify-email", 30, 10 * 60_000);
    const body = await request.json();
    const input = verifyEmailSchema.parse(body);

    const { user, token } = await verifyEmailOtp(input);
    await setAuthCookie(token);

    return successResponse({ user });
  } catch (error) {
    return errorResponse(error);
  }
}
