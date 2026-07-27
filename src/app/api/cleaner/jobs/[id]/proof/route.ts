import { AppError, errorResponse } from "@/lib/apiError";
import { successResponse } from "@/lib/apiResponse";
import { requireRole } from "@/lib/auth";
import {
  addProofIssue,
  getOrCreateServiceProof,
  updateProofTask,
} from "@/services/serviceProofService";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const cleaner = await requireRole("cleaner");
    const { id } = await params;
    return successResponse(await getOrCreateServiceProof(cleaner.id, id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const cleaner = await requireRole("cleaner");
    const { id } = await params;
    const body = (await request.json()) as {
      action?: string;
      key?: string;
      completed?: boolean;
      description?: string;
    };

    if (body.action === "toggle_task") {
      if (typeof body.key !== "string" || typeof body.completed !== "boolean") {
        throw new AppError("Checklist key and completed state are required", 422);
      }
      return successResponse(
        await updateProofTask(cleaner.id, id, body.key, body.completed),
      );
    }
    if (body.action === "report_issue") {
      if (typeof body.description !== "string") {
        throw new AppError("Issue description is required", 422);
      }
      return successResponse(
        await addProofIssue(cleaner.id, id, body.description),
      );
    }
    throw new AppError("Invalid proof-of-service action", 422);
  } catch (error) {
    return errorResponse(error);
  }
}
