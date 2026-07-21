import { NextRequest } from "next/server";
import { verifyEmailSchema } from "@/validators/authValidator";
import { verifyEmailOtp } from "@/services/authService";
import { setAuthCookie } from "@/lib/auth";
import { successResponse } from "@/lib/apiResponse";
import { errorResponse } from "@/lib/apiError";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = verifyEmailSchema.parse(body);

    const { user, token } = await verifyEmailOtp(input);
    await setAuthCookie(token);

    return successResponse({ user });
  } catch (error) {
    return errorResponse(error);
  }
}
