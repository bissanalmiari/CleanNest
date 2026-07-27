import { errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { requireUser } from "@/lib/auth";
import { getBookingProofReports } from "@/services/serviceProofService";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const currentUser = await requireUser();
    const { bookingId } = await params;
    return successResponse(await getBookingProofReports(currentUser, bookingId));
  } catch (error) {
    return errorResponse(error);
  }
}
