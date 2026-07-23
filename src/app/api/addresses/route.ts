// GET  /api/addresses  -> list all saved addresses for the logged-in customer
// POST /api/addresses  -> add a new address
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { createAddressSchema } from "@/validators/addressValidator";
import { getAddresses, createAddress } from "@/services/addressService";
import { successResponse } from "@/lib/apiResponse";
import { errorResponse } from "@/lib/apiError";

export async function GET() {
  try {
    const user = await requireUser();
    const addresses = await getAddresses(user.id);
    return successResponse({ addresses });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const input = createAddressSchema.parse(body);

    const address = await createAddress(user.id, input);
    return successResponse({ address }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}