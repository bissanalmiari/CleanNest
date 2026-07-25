import { errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { requireRole } from "@/lib/rbac";
import { getPaymentByIdForAdmin } from "@/services/paymentService";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole("admin");
    const { id } = await params;
    const payment = await getPaymentByIdForAdmin(id);
    return successResponse(payment);
  } catch (error) {
    return errorResponse(error);
  }
}
