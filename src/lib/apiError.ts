import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, 409);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests, please try again later") {
    super(message, 429);
  }
}

/** Central error -> HTTP response mapper. Use inside a try/catch in route handlers. */
export function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { success: false, error: "Validation failed", issues: (error as ZodError).flatten().fieldErrors },
      { status: 422 }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  }

  console.error("[api-error]", error);
  return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
}