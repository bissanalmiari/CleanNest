import { NextRequest } from "next/server";
import { loginSchema } from "@/validators/authValidator";
import { loginUser } from "@/services/authService";
import { setAuthCookie } from "@/lib/auth";
import { successResponse } from "@/lib/apiResponse";
import { errorResponse } from "@/lib/apiError";
import { enforceAuthRequestRateLimit } from "@/lib/authRateLimit";

export async function POST(request: NextRequest) {
  try {
    await enforceAuthRequestRateLimit(request, "login", 60, 15 * 60_000);
    const body = await request.json();
    const input = loginSchema.parse(body);

    const { user, token } = await loginUser(input);
    await setAuthCookie(token);

    return successResponse({ user });
  } catch (error) {
    return errorResponse(error);
  }
}
