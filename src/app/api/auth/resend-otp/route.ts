import { NextRequest } from "next/server";
import { resendOtpSchema } from "@/validators/authValidator";
import { resendEmailVerificationOtp } from "@/services/authService";
import { messageResponse } from "@/lib/apiResponse";
import { errorResponse } from "@/lib/apiError";
import { enforceAuthRequestRateLimit } from "@/lib/authRateLimit";

export async function POST(request: NextRequest) {
  try {
    await enforceAuthRequestRateLimit(request, "resend-otp", 20, 60 * 60_000);
    const body = await request.json();
    const input = resendOtpSchema.parse(body);

    await resendEmailVerificationOtp(input);

    return messageResponse("A new verification code has been sent to your email");
  } catch (error) {
    return errorResponse(error);
  }
}
