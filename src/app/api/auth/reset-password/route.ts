import { NextRequest } from "next/server";
import { resetPasswordSchema } from "@/validators/authValidator";
import { resetPassword } from "@/services/authService";
import { messageResponse } from "@/lib/apiResponse";
import { errorResponse } from "@/lib/apiError";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = resetPasswordSchema.parse(body);

    await resetPassword(input);

    return messageResponse("Password reset successfully. You can now log in.");
  } catch (error) {
    return errorResponse(error);
  }
}
