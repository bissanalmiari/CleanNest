import { NextRequest } from "next/server";
import { registerSchema } from "@/validators/authValidator";
import { registerUser } from "@/services/authService";
import { successResponse } from "@/lib/apiResponse";
import { errorResponse } from "@/lib/apiError";
import { enforceAuthRequestRateLimit } from "@/lib/authRateLimit";

export async function POST(request: NextRequest) {
  try {
    await enforceAuthRequestRateLimit(request, "register", 10, 60 * 60_000);
    const body = await request.json();
    const input = registerSchema.parse(body);

    const { user, verificationEmailSent } = await registerUser(input);

    return successResponse(
      {
        user,
        verificationEmailSent,
        message: verificationEmailSent
          ? "Account created. Please check your email for a verification code."
          : "Account created, but we couldn't confirm that the verification email was sent. Please check your inbox or request a new code shortly.",
      },
      201
    );
  } catch (error) {
    return errorResponse(error);
  }
}
