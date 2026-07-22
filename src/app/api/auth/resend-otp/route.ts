import { NextRequest } from "next/server";
import { resendOtpSchema } from "@/validators/authValidator";
import { resendEmailVerificationOtp } from "@/services/authService";
import { messageResponse } from "@/lib/apiResponse";
import { errorResponse } from "@/lib/apiError";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = resendOtpSchema.parse(body);

    await resendEmailVerificationOtp(input);

    return messageResponse("A new verification code has been sent to your email");
  } catch (error) {
    return errorResponse(error);
  }
}
