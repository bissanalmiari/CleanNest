import { NextRequest } from "next/server";
import { forgotPasswordSchema } from "@/validators/authValidator";
import { forgotPassword } from "@/services/authService";
import { messageResponse } from "@/lib/apiResponse";
import { errorResponse } from "@/lib/apiError";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = forgotPasswordSchema.parse(body);

    await forgotPassword(input);

    // Always return the same generic message, whether or not the email
    // exists, so this endpoint can't be used to enumerate accounts.
    return messageResponse(
      "If an account exists for this email, a password reset code has been sent"
    );
  } catch (error) {
    return errorResponse(error);
  }
}
