import { NextRequest } from "next/server";
import { registerSchema } from "@/validators/authValidator";
import { registerUser } from "@/services/authService";
import { successResponse } from "@/lib/apiResponse";
import { errorResponse } from "@/lib/apiError";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = registerSchema.parse(body);

    const { user } = await registerUser(input);

    return successResponse(
      {
        user,
        message: "Account created. Please check your email for a verification code.",
      },
      201
    );
  } catch (error) {
    return errorResponse(error);
  }
}
