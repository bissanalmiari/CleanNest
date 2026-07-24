// PATCH /api/addresses/[id]/default -> set this address as the customer's default
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { addressIdParamSchema } from "@/validators/addressValidator";
import { setDefaultAddress } from "@/services/addressService";
import { successResponse } from "@/lib/apiResponse";
import { errorResponse } from "@/lib/apiError";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id } = addressIdParamSchema.parse(await params);

    const address = await setDefaultAddress(user.id, id);
    return successResponse({ address });
  } catch (error) {
    return errorResponse(error);
  }
}
