import { NextRequest } from "next/server";

import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { requireUser } from "@/lib/auth";
import { validatePromoCodeForCustomer } from "@/services/promoCodeService";
import { validatePromoCodeSchema } from "@/validators/promoCodeValidator";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (user.role !== "customer") {
      throw new AppError("Only customers can apply promo codes.", 403);
    }

    const body = await request.json().catch(() => ({}));
    const input = validatePromoCodeSchema.parse(body);
    const promoCode = await validatePromoCodeForCustomer({
      customerId: user.id,
      input,
    });

    return successResponse({ promoCode });
  } catch (error) {
    return errorResponse(error);
  }
}
