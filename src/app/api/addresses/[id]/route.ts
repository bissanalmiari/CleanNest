// PATCH  /api/addresses/[id]  -> update an owned address
// DELETE /api/addresses/[id]  -> delete an owned address
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { addressIdParamSchema, updateAddressSchema } from "@/validators/addressValidator";
import { updateAddress, deleteAddress } from "@/services/addressService";
import { successResponse, messageResponse } from "@/lib/apiResponse";
import { errorResponse } from "@/lib/apiError";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id } = addressIdParamSchema.parse(await params);
    const body = await req.json();
    const input = updateAddressSchema.parse(body);

    const address = await updateAddress(user.id, id, input);
    return successResponse({ address });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireUser();
    const { id } = addressIdParamSchema.parse(await params);

    await deleteAddress(user.id, id);
    return messageResponse("Address deleted");
  } catch (error) {
    return errorResponse(error);
  }
}
