import { NextRequest } from "next/server";
import { resetPasswordSchema } from "@/validators/authValidator";
import { resetPassword } from "@/services/authService";
import { messageResponse } from "@/lib/apiResponse";
import { errorResponse } from "@/lib/apiError";
import { enforceAuthRequestRateLimit } from "@/lib/authRateLimit";

export async function POST(request: NextRequest) {
  try {
    await enforceAuthRequestRateLimit(request, "reset-password", 30, 10 * 60_000);
    const body = await request.json();
    const input = resetPasswordSchema.parse(body);

    await resetPassword(input);

    return messageResponse("Password reset successfully. You can now log in.");
  } catch (error) {
    return errorResponse(error);
  }
}
