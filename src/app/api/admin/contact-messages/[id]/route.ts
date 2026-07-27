import { type NextRequest } from "next/server";

import { errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/rbac";
import { updateContactMessageStatus } from "@/services/contactMessageService";
import {
  contactMessageIdSchema,
  updateContactMessageSchema,
} from "@/validators/contactMessageValidator";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = contactMessageIdSchema.parse(await params);
    const input = updateContactMessageSchema.parse(await request.json());
    const message = await updateContactMessageStatus(id, input.status, admin.id);
    return successResponse({ message });
  } catch (error) {
    return errorResponse(error);
  }
}
