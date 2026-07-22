// PUT /api/profile/password -> change the logged-in user's password
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { changePasswordSchema } from "@/validators/userValidator";
import { changeUserPassword } from "@/services/userService";
import { messageResponse } from "@/lib/apiResponse";
import { errorResponse } from "@/lib/apiError";

export async function PUT(req: NextRequest) {
  try {
    const currentUser = await requireUser();
    const body = await req.json();
    const input = changePasswordSchema.parse(body);

    await changeUserPassword(currentUser.id, input.currentPassword, input.newPassword);

    return messageResponse("Password updated successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
