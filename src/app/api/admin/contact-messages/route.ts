import { type NextRequest } from "next/server";

import { errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/rbac";
import { listContactMessages } from "@/services/contactMessageService";
import { adminContactMessageListSchema } from "@/validators/contactMessageValidator";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const input = adminContactMessageListSchema.parse(params);
    return successResponse(await listContactMessages(input));
  } catch (error) {
    return errorResponse(error);
  }
}
